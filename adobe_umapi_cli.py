#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
import random
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests


IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v2"
UMAPI_BASE_URL = "https://usermanagement.adobe.io/v2/usermanagement"


class UMAPIError(RuntimeError):
    pass


@dataclass(frozen=True)
class AdobeCredentials:
    org_id: str
    client_id: str
    client_secret: str


def _env(name: str) -> str:
    val = os.getenv(name)
    if not val:
        raise UMAPIError(f"Missing required env var: {name}")
    return val


def load_credentials(args: argparse.Namespace) -> AdobeCredentials:
    return AdobeCredentials(
        org_id=args.org_id or _env("ADOBE_ORG_ID"),
        client_id=args.client_id or _env("ADOBE_CLIENT_ID"),
        client_secret=args.client_secret or _env("ADOBE_CLIENT_SECRET"),
    )


def _request_with_retry(
    method: str,
    url: str,
    *,
    headers: Dict[str, str],
    params: Optional[Dict[str, Any]] = None,
    json_body: Optional[Any] = None,
    timeout_s: int = 60,
    max_attempts: int = 6,
) -> requests.Response:
    session = requests.Session()

    for attempt in range(1, max_attempts + 1):
        resp = session.request(
            method,
            url,
            headers=headers,
            params=params,
            json=json_body,
            timeout=timeout_s,
        )

        if resp.status_code != 429:
            return resp

        retry_after = resp.headers.get("Retry-After")
        if retry_after and retry_after.isdigit():
            sleep_s = int(retry_after)
        else:
            # Exponential backoff + jitter
            sleep_s = min(60, (2 ** (attempt - 1))) + random.random()

        time.sleep(sleep_s)

    return resp


def get_access_token(creds: AdobeCredentials) -> str:
    # OAuth Server-to-Server (client credentials)
    params = {
        "grant_type": "client_credentials",
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scope": "openid,AdobeID,user_management_sdk",
    }
    resp = requests.post(IMS_TOKEN_URL, params=params, timeout=60)
    if resp.status_code != 200:
        raise UMAPIError(
            f"Failed to get access token ({resp.status_code}): {resp.text}"
        )
    data = resp.json()
    token = data.get("access_token")
    if not token:
        raise UMAPIError(f"No access_token in IMS response: {data}")
    return token


def umapi_headers(creds: AdobeCredentials, token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "X-Api-Key": creds.client_id,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def iter_paged(
    fetch_page,
) -> Iterable[Tuple[int, Dict[str, Any]]]:
    page = 0
    while True:
        payload = fetch_page(page)
        yield page, payload
        if payload.get("lastPage") is True:
            return
        page += 1


def list_users(creds: AdobeCredentials, token: str, direct_only: bool = True) -> List[Dict[str, Any]]:
    headers = umapi_headers(creds, token)

    def fetch_page(page: int) -> Dict[str, Any]:
        url = f"{UMAPI_BASE_URL}/users/{creds.org_id}/{page}"
        params = {"directOnly": "true" if direct_only else "false"}
        resp = _request_with_retry("GET", url, headers=headers, params=params)
        if resp.status_code != 200:
            raise UMAPIError(f"List users failed ({resp.status_code}): {resp.text}")
        return resp.json()

    users: List[Dict[str, Any]] = []
    for _, payload in iter_paged(fetch_page):
        users.extend(payload.get("users", []) or [])
    return users


def list_groups_and_profiles(creds: AdobeCredentials, token: str) -> List[Dict[str, Any]]:
    headers = umapi_headers(creds, token)

    def fetch_page(page: int) -> Dict[str, Any]:
        url = f"{UMAPI_BASE_URL}/groups/{creds.org_id}/{page}"
        resp = _request_with_retry("GET", url, headers=headers)
        if resp.status_code != 200:
            raise UMAPIError(f"List groups failed ({resp.status_code}): {resp.text}")
        return resp.json()

    groups: List[Dict[str, Any]] = []
    for _, payload in iter_paged(fetch_page):
        groups.extend(payload.get("groups", []) or [])
    return groups


def product_profiles(groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [g for g in groups if (g.get("type") == "PRODUCT_PROFILE")]


def user_product_profiles(user: Dict[str, Any], profile_names: Optional[set] = None) -> List[str]:
    # In UMAPI user listing, memberships are in "groups" array (names).
    groups = user.get("groups") or []
    if not isinstance(groups, list):
        return []
    if profile_names is None:
        return [str(x) for x in groups]
    return [str(x) for x in groups if str(x) in profile_names]


def action_add_remove_profiles(
    creds: AdobeCredentials,
    token: str,
    *,
    user_email: str,
    add_profiles: List[str],
    remove_profiles: List[str],
    test_only: bool = False,
) -> Dict[str, Any]:
    if not add_profiles and not remove_profiles:
        raise UMAPIError("Nothing to do: no add/remove profiles provided.")

    steps: List[Dict[str, Any]] = []
    if add_profiles:
        steps.append({"add": {"group": add_profiles}})
    if remove_profiles:
        steps.append({"remove": {"group": remove_profiles}})

    commands = [
        {
            "user": user_email,
            "requestID": f"cli_{int(time.time())}",
            "do": steps,
        }
    ]

    headers = umapi_headers(creds, token)
    url = f"{UMAPI_BASE_URL}/action/{creds.org_id}"
    params = {"testOnly": "true"} if test_only else None
    resp = _request_with_retry("POST", url, headers=headers, params=params, json_body=commands)
    if resp.status_code != 200:
        raise UMAPIError(f"Action failed ({resp.status_code}): {resp.text}")
    return resp.json()


def cmd_list_users(args: argparse.Namespace) -> None:
    creds = load_credentials(args)
    token = get_access_token(creds)
    users = list_users(creds, token, direct_only=not args.include_indirect)

    if args.json:
        print(json.dumps(users, indent=2, sort_keys=True))
        return

    for u in users:
        email = u.get("email", "")
        status = u.get("status", "")
        groups = u.get("groups") or []
        print(f"{email}\t{status}\t{len(groups)} groups")


def cmd_list_profiles(args: argparse.Namespace) -> None:
    creds = load_credentials(args)
    token = get_access_token(creds)
    groups = list_groups_and_profiles(creds, token)
    profiles = product_profiles(groups)

    if args.json:
        print(json.dumps(profiles, indent=2, sort_keys=True))
        return

    # Tabular-ish output
    for p in sorted(profiles, key=lambda x: (x.get("productName") or "", x.get("groupName") or "")):
        name = p.get("groupName", "")
        product = p.get("productName", "")
        quota = p.get("licenseQuota", "")
        members = p.get("memberCount", "")
        print(f"{product}\t{name}\tquota={quota}\tmembers={members}")


def cmd_export(args: argparse.Namespace) -> None:
    creds = load_credentials(args)
    token = get_access_token(creds)
    groups = list_groups_and_profiles(creds, token)
    profiles = product_profiles(groups)
    profile_names = {p.get("groupName") for p in profiles if p.get("groupName")}

    users = list_users(creds, token, direct_only=not args.include_indirect)

    out_path = args.out
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "email",
                "status",
                "type",
                "firstname",
                "lastname",
                "country",
                "username",
                "product_profiles",
            ],
        )
        w.writeheader()
        for u in users:
            u_profiles = user_product_profiles(u, profile_names=profile_names)
            w.writerow(
                {
                    "email": u.get("email", ""),
                    "status": u.get("status", ""),
                    "type": u.get("type", ""),
                    "firstname": u.get("firstname", ""),
                    "lastname": u.get("lastname", ""),
                    "country": u.get("country", ""),
                    "username": u.get("username", ""),
                    "product_profiles": ";".join(sorted(u_profiles)),
                }
            )

    print(f"Wrote {len(users)} users to {out_path}")


def _resolve_profiles(
    profiles: List[Dict[str, Any]],
    requested: List[str],
) -> List[str]:
    # UMAPI add/remove uses groupName strings. We'll do case-insensitive exact match
    # and also allow prefix match when it uniquely identifies one profile.
    by_lower = {str(p.get("groupName")).lower(): str(p.get("groupName")) for p in profiles if p.get("groupName")}
    all_names = [str(p.get("groupName")) for p in profiles if p.get("groupName")]

    resolved: List[str] = []
    for r in requested:
        key = r.strip()
        if not key:
            continue
        lower = key.lower()
        if lower in by_lower:
            resolved.append(by_lower[lower])
            continue

        matches = [name for name in all_names if name.lower().startswith(lower)]
        if len(matches) == 1:
            resolved.append(matches[0])
            continue

        if len(matches) > 1:
            raise UMAPIError(
                f"Profile '{r}' is ambiguous. Matches: {matches[:10]}{'...' if len(matches) > 10 else ''}"
            )
        raise UMAPIError(f"Unknown product profile: '{r}'")

    # Deduplicate while preserving order
    seen = set()
    out: List[str] = []
    for x in resolved:
        if x not in seen:
            out.append(x)
            seen.add(x)
    return out


def cmd_assign(args: argparse.Namespace) -> None:
    creds = load_credentials(args)
    token = get_access_token(creds)
    profiles = product_profiles(list_groups_and_profiles(creds, token))
    to_add = _resolve_profiles(profiles, args.profile)

    result = action_add_remove_profiles(
        creds,
        token,
        user_email=args.user,
        add_profiles=to_add,
        remove_profiles=[],
        test_only=args.test_only,
    )
    print(json.dumps(result, indent=2, sort_keys=True))


def cmd_unassign(args: argparse.Namespace) -> None:
    creds = load_credentials(args)
    token = get_access_token(creds)
    profiles = product_profiles(list_groups_and_profiles(creds, token))
    to_remove = _resolve_profiles(profiles, args.profile)

    result = action_add_remove_profiles(
        creds,
        token,
        user_email=args.user,
        add_profiles=[],
        remove_profiles=to_remove,
        test_only=args.test_only,
    )
    print(json.dumps(result, indent=2, sort_keys=True))


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Adobe Admin Console (UMAPI) users/licenses extraction + license assignment tool"
    )
    p.add_argument("--org-id", help="Org ID (or set ADOBE_ORG_ID)")
    p.add_argument("--client-id", help="OAuth client id (or set ADOBE_CLIENT_ID)")
    p.add_argument("--client-secret", help="OAuth client secret (or set ADOBE_CLIENT_SECRET)")

    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("list-users", help="List users in org")
    sp.add_argument("--include-indirect", action="store_true", help="Include indirect product-profile memberships")
    sp.add_argument("--json", action="store_true", help="Output full JSON")
    sp.set_defaults(func=cmd_list_users)

    sp = sub.add_parser("list-profiles", help="List product profiles (licenses)")
    sp.add_argument("--json", action="store_true", help="Output full JSON")
    sp.set_defaults(func=cmd_list_profiles)

    sp = sub.add_parser("export", help="Export users and their product profiles to CSV")
    sp.add_argument("--out", required=True, help="Output CSV path")
    sp.add_argument("--include-indirect", action="store_true", help="Include indirect memberships")
    sp.set_defaults(func=cmd_export)

    sp = sub.add_parser("assign", help="Assign product profile(s) to a user")
    sp.add_argument("--user", required=True, help="User email")
    sp.add_argument("--profile", required=True, action="append", help="Product profile name (repeatable)")
    sp.add_argument("--test-only", action="store_true", help="Validate only (no changes)")
    sp.set_defaults(func=cmd_assign)

    sp = sub.add_parser("unassign", help="Remove product profile(s) from a user")
    sp.add_argument("--user", required=True, help="User email")
    sp.add_argument("--profile", required=True, action="append", help="Product profile name (repeatable)")
    sp.add_argument("--test-only", action="store_true", help="Validate only (no changes)")
    sp.set_defaults(func=cmd_unassign)

    return p


def main(argv: List[str]) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        args.func(args)
        return 0
    except UMAPIError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2
    except requests.RequestException as e:
        print(f"HTTP ERROR: {e}", file=sys.stderr)
        return 3


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

