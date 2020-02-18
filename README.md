# Simple shell for Textile threads

## Overview

This is a simple shell for interacting with the Textile API. Under the hood it's proxying to `js-threads-client` and supports all API methods. It supports switching between stores (kind of like switching between dbs in Mongo's shell).

## Install

The shell depends on Node v12.16.0 and npm v6.13.4, so get those installed first. Then grab the shell and install the dependencies and optionally run the tests:

```bash
$ git clone git@github.com:eightysteele/thread-shell.git
$ cd thread-shell
$ npm i
$ npm test
```

## Usage

For local development, first fire up the Textile thread daemon in a terminal window:

```bash
$ git clone https://github.com/textileio/go-threads.git
$ cd go-threads
$ go run threadsd/main.go
Welcome to Threads!
Your peer ID is 12D3KooWQmjkYj5SiN6dPHVbD4M8dQ64PF1tTQCqMHvSAQvaydsh
```

Now fire up the shell and connect to the Textile thread daemon:

```bash
$ cd thread-shell
$ ./shell
threads> auth()
Authenticating...
threads> Connected to Textile API: http://127.0.0.1:6007
```

You can also connect to the Textile cloud if you have credentials. I still need to test this with some valid creds haha. :)

```bash
threads> auth({token: "MY_TOKEN", deviceID: "MY_DEVICE_ID"})
Authenticating...
threads> Connected to Textile API: http://cloud.textile.io
```

From there, take a look at the `help()` menu. Here's an example that creates 2 stores and switches between them:

```bash
threads> newStore()
Creating new store...
threads> { id: '76f6d8c0-b739-4d5e-8669-c18d92f95bfc' }
threads> newStore()
Creating new store...
threads> { id: '11bc75cd-7f50-40b9-9709-6f219deb7f4c' }
threads> store.id()
'11bc75cd-7f50-40b9-9709-6f219deb7f4c'
threads> showStores()
[
  '76f6d8c0-b739-4d5e-8669-c18d92f95bfc',
  '11bc75cd-7f50-40b9-9709-6f219deb7f4c'
]
threads> use('76f6d8c0-b739-4d5e-8669-c18d92f95bfc')
Switching stores...
threads> { id: '76f6d8c0-b739-4d5e-8669-c18d92f95bfc' }
```

## TODOs
- [ ] investigate `Error: Response closed without grpc-status (Headers only)`
- [ ] test `getCloudClient(creds, cb)` with real credentials
- [ ] check if `nc` is cross platform 
- [ ] make repl context properties read-only by default (so that users can't accidentally over-write)
- [ ] handle REPL context reloads

## API nits
* maybe add a human readable `name` to store objects
