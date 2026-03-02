# Product Name

# Setup

From the repo root, run

```sh
$ dotnet tool restore
```

This will install EF and TypeGen tooling.

## Set Visual Studio startup

* Select *Configure Startup Projects...*
* Select *Multiple*
* Under *Action*, set *Start* for `Base2.Web` and `Base2.Background`
* Under *Debug Target*, select `http` for `Base2.Web`

## Run migration scripts

Since we're quickly iterating on the database, we don't commit migrations yet.
Instead, we rebuild the database often, by running these two scripts.

```sh
cd src\server\Base2.Data\src
reset-sqlite-app-database.cmd
reset-sqlite-warehouse-database.cmd
```

## Add secrets

```sh
cd src\server\Base2.Web\src
add-secrets
```

## Initialize the client

```sh
cd src\client
npm install
```

# Projects and ports

client

* web 8383
* admin 8484
* app 8585
* common

server

* API http 8181
* API https 8282
