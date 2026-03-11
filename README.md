# Adobe Admin Console (UMAPI) CLI

Small CLI to extract **users** and **product profiles (licenses)** from Adobe Admin Console, and to **add/remove** product-profile access for a user.

## Prereqs

- Create an **OAuth Server-to-Server** project in Adobe Developer Console with **User Management API** access.
- Collect:
  - **Org ID** (looks like `A495E53@AdobeOrg`)
  - **Client ID**
  - **Client Secret**

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Set environment variables:

```bash
export ADOBE_ORG_ID="A495E53@AdobeOrg"
export ADOBE_CLIENT_ID="..."
export ADOBE_CLIENT_SECRET="..."
```

## Commands

List product profiles (licenses):

```bash
python adobe_umapi_cli.py list-profiles
```

List users (paged; includes groups/product profiles):

```bash
python adobe_umapi_cli.py list-users
```

Export users + their product profiles to CSV:

```bash
python adobe_umapi_cli.py export --out users.csv
```

Assign a product profile to a user:

```bash
python adobe_umapi_cli.py assign --user "person@company.com" --profile "Default Support Profile"
```

Remove a product profile from a user:

```bash
python adobe_umapi_cli.py unassign --user "person@company.com" --profile "Default Support Profile"
```

Dry-run (server-side validation, no changes):

```bash
python adobe_umapi_cli.py assign --test-only --user "person@company.com" --profile "Default Support Profile"
```

## Notes

- UMAPI treats **licenses** as **membership in Product Profiles**; this CLI assigns/removes a profile by name.
- API rate limits are strict; the CLI includes basic retry/backoff for `429` responses.
