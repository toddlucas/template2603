EF Core Naming
==============

# Plurals

We name `DbSet`s as plural, while the underlying table is singular.
We want all DB objects to use snake case, to address the PG case folding problem.
Since it doesn't cause a problem with Sqlite, we also use it there.
This is both to simplify, and to allow writing explicit SQL that is compatible with both.

# SQL Identifiers

To address this, we have used explicit EF Core methods, like `ToTable` and `HasColumnName`.

This project is using a different approach, which is to automatically convert object names to snake case.

The end result is:

| Object          | Original                         | Renamed                             | PostgreSQL                            |
|-----------------|----------------------------------|-------------------------------------|---------------------------------------|
| Table           | ExampleNameTable                 | example_name_table                  | example_name_table                    |
| Identity table* | AspNetExampleNameTable           | identity_example_name_table         | identity_example_name_table           |
| Column          | OtherId                          | other_id                            | other_id                              |
| PK constraint   | PK_ExampleName                   | pk_example_name                     | example_name_pkey                     |
| FK constraint   | FK_ExampleName_OtherName_OtherId | fk_example_name_other_name_other_id | example_name_other_name_other_id_fkey |
| Unique          | ExampleNameIndex                 | user_name_index                     | user_name_idx                         |
| Index           | IX_ExampleName_OtherId           | ix_example_name_other_id            | example_name_other_id_idx             |

\* The AspNetCore.Identity system names tables with an AspNet prefix and pluralizes, so these are special cased.

The end result is that, when using EF Code first, the runtime gives different names to constraints than PG would normally give.
This is a trade off that we have to make when running in this mode.
What we can do is to change the case, so that at least we don't have the identifier quoting due to case folding.

See PosgreSQL [4.1.1. Identifiers and Key Words](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS).
