# Localhost Setup & Running on Fedora 42 (linux)

## Setup environment variables file with credentials

Create `server/.env` with credentials (values of some but not all are stored in Google Secrets Manager in Google Cloud after login, rest were shared directly):

```
# Google OAuth:
GEMINI_API_KEY=      # put credential here
GCS_BUCKET_NAME=     # put bucket name here
JWT_SECRET=          # put credential here
GOOGLE_CLIENT_ID=     # put credential here
GOOGLE_CLIENT_SECRET=  # put credential here

# these are used in production (PostgreSQL on Google Cloud SQL) but not locally AFAIK
DATABASE_URL=  # put url here, has format: "postgresql://{DB_USERNAME}:{DB_PASSWORD}@localhost:{DB_PORT}/{DATABASE_NAME}"
INSTANCE_CONNECTION_NAME=   # put CloudSQL instance name, of the format "{GOOGLE_CLOUD_INSTANCE_NAME}.{GOOGLE_CLOUD_REGION}:{GOOGLE_CLOUD_PROJECT_NAME}" where region of google cloud usually starts with "us-" (USA based regions)
```

## Install & start Postgres Database

Very useful, steps below taken from here onlys: [Official Fedora Postgres guide](https://docs.fedoraproject.org/en-US/fedora-server/services/postgresql-setup/)

```bash
$ sudo dnf install postgresql-server       # install
$ sudo ls -alZ /var/lib/pgsql              # verify successful install, sample output from docs above
drwx------.  4 postgres postgres system_u:object_r:postgresql_db_t:s0   54  ...  .
drwxr-xr-x. 45 root     root     system_u:object_r:var_lib_t:s0       4096  ...  ..
drwx------.  2 postgres postgres system_u:object_r:postgresql_db_t:s0       ...  backups
-rw-r--r--.  1 postgres postgres system_u:object_r:postgresql_db_t:s0       ...  .bash_profile
drwx------.  2 postgres postgres system_u:object_r:postgresql_db_t:s0
# IMPORTANT (according to docs above): verify that, like shown in above output, /var/lib/pgsql MUST BE owned and have permssions for user "postgres" only

# if something went wrong in install, try below commands (I commented because install already successful for me)
# $ sudo restorecon  -vFr /var/lib/pgsql
# $ sudo ls -alZ  /var/lib/pgsql/

# initialize database cluster, pre-requisite for running any commands in postgress
$ sudo postgresql-setup --initdb      # sudo needed because /var/lib/pgsql  is owned by user "pgsql" NOT current user who installed postgres
# above command creates and populates folder /var/lib/pgsql/data/
```

now modify config as shown in docs using any editor (nano, vim, VS Code etc.): `sudo nano  /var/lib/pgsql/data/pg_hba.conf`:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
# "local" is for Unix domain socket connections only
local   all             all                                     peer
# IPv4 local connections:
host    all             all             127.0.0.1/32            ident
# IPv4 internal network connections:                                  # <- modification!
host    all             all             192.168.122.1/24        md5   # <- modification! NOTE: this was IP in docs, not sure I think current IP should be put instead? (check current IP with: ip addr show)
# IPv6 local connections:
host    all             all             ::1/128                 ident
# Allow replication connections from localhost, by a user with the
```

Start postgres server service in background:

```bash
$ sudo systemctl start postgresql.service       # if success no output, else error message
$ sudo systemctl status postgresql.service         # verify it started correctly by checking postgres logs
```

NOTE: If any modification is made to postgres config `/var/lib/pgsql/data/pg_hba.conf`, you need to do this for new config to take effect:

```bash
$ sudo systemctl restart postgresql.service      # restart postgres db server
```

[Create database (skipping user as we're using postgres default user only)](https://stackoverflow.com/a/30642050/12947681), then Start postgres REPL as Root user:

```bash
# $ sudo -u createuser testuser   # SKIPPING, we're directly using root default user postgres
$ sudo -u postgres createdb teamsso    # -u postgres means run as user postgres
$ sudo -u postgres pgsql          # -u postgres means run as user postgres
pgsql (16.9)
Type "help" for help.

postgres=# ALTER USER postgres WITH PASSWORD 'example_database_password'    # best to use same DB password used in production, password here has to match what is put in server/.env for app to run - ensure SINGLE QUOTES 
# postgres=# grant all privileges on database teamsso to postgres  # SKIP: we're using root user postgres which already has all priviliges
# NOTE: stackoverflow answer recommended "ENCRYPTED PASSWORD" but went for PASSWORD only for now
postgres=# \l         # list databases to confirm: teamsso db has been created
postgres=# \c teamsso       # use this db
You are now connected to database "teamsso" as user "postgres"
postgres=# \dt        # list tables in current db
Did not find any relations.
postgres=# \q        # quit
```

psql -h localhost -p 5432 -U postgres -d teamsso -W    # -W forces psql to prompt for database user password

switch to user postgres and open bash repl:

```bash
$ sudo --user postgres /bin/bash
```

## TSX (Typescript) REPL: Import & run server functions (here db module function query)

Install `tsx` (REPL for directly running TypeScript `*.ts` files, since normal `node` would raise error due to presence of types of TypeScript):

```bash
$ npm install --global tsx
```

First ensure you're inside current team sso repo (`cd /path/to/Team-SSO/`). Now start TypeScript REPL in current project context by running commmand `tsx`:

```typescript
// this import method didnt' work for me
> import { query } from './server/src/db/index.ts'
import { query } from "./server/src/db/index.ts";
^^^^^^

Uncaught:
SyntaxError: Cannot use import statement inside the Node.js REPL, alternatively use dynamic import: const { query } = await import("./server/src/db/index.ts");

// this also didn't work (query function didn't get imported but got undefined somehow)
> const { query } = await import("./server/src/db/index.ts");
undefined
> query
undefined

// finally this import method worked!
> const mod = await import("./server/src/db/index.ts");
undefined
> mod
[Module: null prototype] {
  default: {
    closePool: [Getter],
    default: [Getter],
    getClient: [Getter],
    query: [Getter]
  },
  'module.exports': {
    closePool: [Getter],
    default: [Getter],
    getClient: [Getter],
    query: [Getter]
  }
}
> mod.default.query
[AsyncFunction: query]
```

## Run standalone script/test TypeScript by importing server functions

Mk this standalone script and save at `server/scripts/test.ts` (scripts folder and filename are arbitary, can choose anything else also):

```typescript
// here this import style worked, not sure why not directly in tsx REPL
import { query } from '../src/db';

async function main() {
    const example_id = 1;
    const deckResult = await query(`
        SELECT d.*, c.name as company_name, c.stage, c.industry
        FROM pitch_decks d
        LEFT JOIN companies c ON d.company_id = c.id
        WHERE d.id = $1
    `, [example_id]);
    console.log(deckResult);
}

main()
```

Now run it:

```bash
$ tsx server/scripts/test.ts
📡 Connecting to database at localhost:5432
Database query error: error: Ident authentication failed for user "postgres"
```