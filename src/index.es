/**
 * Resource Manager
 */
export default class ResourceManager
{
	/**
	 * internal types
	 * @typedef {*} Type_ResourceManager_Resource
	 * @typedef {*} Type_ResourceManager_Options
	 * @typedef {function(Type_ResourceManager_Options):Type_ResourceManager_Resource} Type_ResourceManager_OpenFunction
	 * @typedef {function(Type_ResourceManager_Resource)} Type_ResourceManager_CloseFunction
	 * @typedef {{open: Type_ResourceManager_OpenFunction, close: Type_ResourceManager_CloseFunction}} Type_ResourceManager_OpenCloseFunctions
	 * @typedef {function()} Type_ResourceManager_CloseWrapperFunction
	 */

	/**
	 * factory method
	 * @return {ResourceManager}
	 */
	static factory()
	{
		const objResourceManager = new ResourceManager();

		// built-in resources
		return objResourceManager
			.register(
				"array",
				/**
				 * open
				 * @return {Array}
				 */
				() =>
				{
					return [];
				},
				/**
				 * close
				 * @param {Array} array
				 */
				(array) =>
				{
					array.splice(0, array.length);
				}
			)
			.register(
				"map",
				/**
				 * open
				 * @return {Map}
				 */
				() =>
				{
					return new Map();
				},
				/**
				 * close
				 * @param {Map} map
				 */
				(map) =>
				{
					map.clear();
				}
			)
			.register(
				"set",
				/**
				 * open
				 * @return {Set}
				 */
				() =>
				{
					return new Set();
				},
				/**
				 * close
				 * @param {Set} set
				 */
				(set) =>
				{
					set.clear();
				}
			);
	}

	/**
	 * constructor
	 */
	constructor()
	{
		/** @type {Map<string, Type_ResourceManager_OpenCloseFunctions>} */
		this._resourceFunctionsMap = new Map();
		/** @type {Map<string, Type_ResourceManager_Resource>} */
		this._resourceSingletonMap = new Map();
		/** @type {Type_ResourceManager_CloseWrapperFunction[]} */
		this._closeCallbacks = [];
		/** @type {boolean} */
		this._closed = false;
	}

	/**
	 * register resource
	 * @param {string} name
	 * @param {Type_ResourceManager_OpenFunction} open
	 * @param {Type_ResourceManager_CloseFunction} close
	 * @return {ResourceManager}
	 */
	register(name, open, close)
	{
		this._resourceFunctionsMap.set(name, {
			open: open,
			close: close,
		});
		return this;
	}

	/**
	 * open a resource
	 * @param {string} name
	 * @param {?Type_ResourceManager_Options} options
	 * @return {Type_ResourceManager_Resource}
	 * @throws {Error}
	 */
	open(name, options = null)
	{
		if(this._closed)
		{
			throw new Error(`ResourceManager: resources are already closed`);
		}

		const resourceFunctions = this._resourceFunctionsMap.get(name);
		if(resourceFunctions === undefined)
		{
			throw new Error(`ResourceManager: resource name "${name}" is unregistered`);
		}

		const resource = resourceFunctions.open(options);
		this._closeCallbacks.push(() =>
		{
			resourceFunctions.close(resource);
		});

		return resource;
	}

	/**
	 * open a resource; singleton
	 * @param {string} name
	 * @param {?Type_ResourceManager_Options} options
	 * @return {Type_ResourceManager_Resource}
	 * @throws {Error}
	 */
	openSingleton(name, options = null)
	{
		const key = JSON.stringify([name, options]);
		const objResource = this._resourceSingletonMap.get(key);
		if(objResource !== undefined)
		{
			return objResource;
		}

		const objResourceNew = this.open(name, options);
		this._resourceSingletonMap.set(key, objResourceNew);

		return objResourceNew;
	}

	/**
	 * close all resources
	 */
	close()
	{
		const callbacks = this._closeCallbacks;
		while(callbacks.length > 0)
		{
			// call in inverted order
			const callback = callbacks.pop();
			callback();
		}

		this._resourceFunctionsMap.clear();
		this._resourceSingletonMap.clear();
		this._closed = true;
	}
}
