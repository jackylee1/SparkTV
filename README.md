# COMS W6998 Projects Repo

### Requirement:
FIRST: set up your ssh keys with [GitHub](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/)

- [Typescript](http://typescriptlang.org)
  - Definitely Typed
- [Node](http://nodejs.org)
  - Node Package Manager (npm)
- [Gulp](http://gulpjs.com)
  - gulpfile.js
- [Expressjs](http://expressjs.com)
- [AngularJS](http://angularjs.org)
  - Version 1
- [Bootstrap](http://getbootstrap.com)
- Unit test = [TDD (Test Driven Develop)](https://en.wikipedia.org/wiki/Test-driven_development)
  - Framework to use:
    - Runner: [Wallaby.js](https://wallabyjs.com/)
    - Tester: [MochaJS](https://mochajs.org/)
- [MySQL](http://mysql.com)
- [RESTful API (Http call: GET POST PUT DELETE...)](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol)
  - Testing Tool: 
    - Postman (on mac)
    - REST Client (in VSCode)
    - HttpRequester (in Sublime)
    - RESTAngular (in code)

### Coding Guideline
- [TypeScript](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)
- [JSON](https://google.github.io/styleguide/jsoncstyleguide.xml)
- [Unit Test](http://geosoft.no/development/unittesting.html)

### RESTful API Guideline
```
/Collections
  - GET
  - POST
    /{Parameters}
      - GET
      - PUT
      - DELETE
```

### For every .TS file
Please include this at the beginning:
```typescript
/// <reference path="../typings/index.d.ts" />
import * as lambda from 'aws-lambda'
import * as sdk from 'aws-sdk'
```

### Request JSON example
1. /address
- POST
```
{
  "uuid": xxx,
  "city": xxx,
  "num": xxx,
  "street": xxx,
  "zipcode": xxx
}
```

1. /address/{id}
- PUT
```
{
  "<field>": "<value>"
}
```
Expression example: "set firstname=:fn, lastname=:ln",
Values Example: {":fn": "fffnnn", ":ln": "lllnnn"}.

1. /customers
- POST
```
{
  "email": xxx,
  "firstname": xxx,
  "lastname": xxx,
  "phonenumber": xxx,
  "address_ref": xxx
}
```

1. /customers/{email}
- PUT
```
{
  "<field>": "<value>"
}
```
