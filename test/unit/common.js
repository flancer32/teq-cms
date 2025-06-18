/**
 * Provides a utility to create a configured TeqFW DI container for unit testing.
 */
import path from 'node:path';

class Container {
    constructor() {
        this._registry = new Map();
        this._instances = new Map();
        this._resolver = new Resolver(this);
    }

    getResolver() {
        return this._resolver;
    }

    enableTestMode() {}

    register(name, value) {
        this._registry.set(name, value);
    }

    async get(name) {
        if (this._instances.has(name)) return this._instances.get(name);

        if (this._registry.has(name)) {
            const val = this._registry.get(name);
            this._instances.set(name, val);
            return val;
        }

        if (name.startsWith('node:')) {
            const mod = await import(name);
            this._instances.set(name, mod);
            return mod;
        }

        const file = this._resolver.resolve(name);
        if (!file) throw new Error(`Cannot resolve ${name}`);
        const mod = await import(file);
        const Ctor = mod.default || mod;
        const ctorSrc = Ctor.toString();
        const match = ctorSrc.match(/constructor\s*\(\s*\{([^}]*)\}\s*\)/);
        let deps = {};
        if (match) {
            const props = match[1]
                .split(',')
                .map(p => {
                    const m = p.match(/^(?:\s*['"]([^'"]+)['"]|\s*([^:]+))\s*:/);
                    return m ? (m[1] || m[2]).trim() : '';
                })
                .filter(Boolean);
            for (const p of props) {
                deps[p] = await this.get(p);
            }
        }
        const instance = new Ctor(deps);
        this._instances.set(name, instance);
        return instance;
    }
}

class Resolver {
    constructor(container) {
        this._container = container;
        this._roots = [];
    }

    addNamespaceRoot(prefix, root) {
        this._roots.push([prefix, root]);
    }

    resolve(name) {
        for (const [prefix, root] of this._roots) {
            if (name.startsWith(prefix)) {
                const rel = name
                    .slice(prefix.length)
                    .replace(/_+/g, '/')
                    .replace(/\$$/, '');
                return path.join(root, `${rel}.js`);
            }
        }
        return null;
    }
}

// Resolve the plugin source path relative to this script
const SRC = path.resolve(import.meta.dirname, '../../src');

/**
 * Builds a test DI container for unit tests.
 * Registers plugin namespace and enables test mode.
 *
 * @returns {TeqFw_Di_Container} Test container instance.
 */
export function buildTestContainer() {
    const container = new Container();
    const resolver = container.getResolver();
    resolver.addNamespaceRoot('Fl32_Cms_', SRC);
    container.enableTestMode();
    return container;
}
