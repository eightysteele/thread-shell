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

You can also connect to the Textile cloud if you have credentials:

```bash
threads> auth({token: "MY_TOKEN", deviceID: "MY_DEVICE_ID"})
Authenticating...
threads> Connected to Textile API: http://cloud.textile.io
```

From there, take a look at the `help()` menu. Here's a short demo:

```bash
$ ./shell
threads> auth()
Authenticating...
threads> Authenticated!
threads> Connected to Textile API: http://127.0.0.1:6007
threads> use('test')
threads> db
Database {
  db: DB {
    client: Client { config: [Config] },
    name: 'test',
    id: '5753d7de-6e71-4202-a38c-e69078437790',
    collections: Map {}
  }
}
threads> db.createCollection('person', playground.schema)
threads> Collection person created.
threads> db.person.create([playground.adam, playground.eve])
threads> Entities created in collection person
threads> db.person.find(new Where('firstName').eq('Adam'))
threads> {
  entitiesList: [
    {
      firstName: 'Adam',
      lastName: 'Doe',
      age: 21,
      ID: 'b75187f8-f721-4112-bba5-7cd538d5a5ac'
    }
  ]
}
```

## TODOs
- [ ] investigate `Error: Response closed without grpc-status (Headers only)`
- [ ] test `getCloudClient(creds, cb)` with real credentials
- [ ] check if `nc` is cross platform 
- [ ] make repl context properties read-only by default (so that users can't accidentally over-write)
- [ ] handle REPL context reloads
- [ ] it's unclear if/when `start` needs to be called: https://github.com/textileio/js-threads-client/blob/master/src/index.ts#L101

## API nits
* maybe add a human readable `name` to store objects
