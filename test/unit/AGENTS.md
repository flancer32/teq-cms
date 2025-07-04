# Unit Testing in the Project

The project uses constructor-based dependency injection via the `@teqfw/di` package. This allows unit tests to **fully mock the environment** of the tested code — including Node.js built-in modules.

## `common.js`

This is a shared file for all tests. It configures the object container to work with the project's source code (source directory). After creation, the container is switched to test mode and can register dependencies explicitly.

## Creating the Container and Registering Dependencies

```js
import {buildTestContainer} from '../common.js';

/** @type {TeqFw_Di_Container} */
container = buildTestContainer();
container.register('Vendor_Project$', {
    init: () => {},
});
```

### Important

* The container must be created inside each individual test (`it()`), since dependencies are customized for specific test conditions.
* A dependency can be registered in the container only once; re-registering the same dependency is not allowed.
 