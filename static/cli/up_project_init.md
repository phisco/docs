---
mdx:
  format: md
---

Initialize a new project.

This command initializes a new project. By default, it will start a wizard to
help you create a new project. The project will be created in a new directory
named after the project. You can specify which template to use with the
`--template` flag along with the `--language` flag.

#### Supported Languages

The following slugs are accepted as arguments by the `--language` and
`--test-language` flags:

| Language | Slug |
| -------- | ---- |
| Go | go |
| Go Templates | go-templating |
| KCL | kcl |
| Python | python |

#### Examples

Initialize a project called `my-new-project` using the AWS S3 bucket example
with Python functions and tests:

```shell
up project init my-new-project --template project-template-aws-s3 \
    --language python
```

Initialize a project called `my-new-project` with Go functions and Python tests:

```shell
up project init my-new-project --template project-template-aws-s3 \
    --language go --test-language python
```

Initialize a project using a public template repository at a specific ref:

```shell
up project init my-new-project \
    --template 'https://github.com/upbound/project-template-aws-s3@main' \
    --language kcl
```

Initialize a project from a template using Git token authentication:

```shell
up project init my-new-project \
    --template 'https://github.com/your-org/your-private-template.git' \
    --language kcl  \
    --username 'username' \
    --password 'token'
```

Initialize a project from a template using SSH authentication:

```shell
up project init my-new-project \
    --template 'git@github.com:your-org/your-private-template.git' \
    --language kcl \
    --ssh-key /Users/username/.ssh/id_rsa
```

Initialize a new project from a private template using SSH authentication with
an SSH key password:

```shell
up project init my-new-project \
    --template 'git@github.com:your-org/your-private-template.git' \
    --language kcl \
    --ssh-key /Users/username/.ssh/id_rsa \
    --password 'ssh-key-password'
```


#### Usage

`up project init <name> [flags]`
#### Arguments

| Argument | Description |
| -------- | ----------- |
| `<name>` | The name of the new project to initialize. |
#### Flags

| Flag | Short Form | Description |
| ---- | ---------- | ----------- |
| `--directory` | | The directory to initialize. It must be empty. It will be created if it doesn't exist. |
| `--scratch` | | Create a new project from scratch. |
| `--template` | `-t` | The template to use to initialize the new project. |
| `--values` | | Values to use for templating the project. |
| `--state-file` | | Path to wizard state file. |
| `--language` | `-l` | The language to use to initialize the new project. |
| `--test-language` | | The language to use for tests in the new project. |
| `--ssh-key` | | Optional. Specify an SSH key for authentication when initializing the new package. Used when transport protocol is 'ssh'. |
| `--username` | | Optional. Specify a username for authentication. Used when transport protocol is 'https' and an SSH key is not provided, or with an SSH key when the transport protocol is 'ssh'. |
| `--password` | | Optional. Specify a password for authentication. Used with the username when the transport protocol is 'https', or with an SSH key that requires a passphrase when the transport protocol is 'ssh'. |
