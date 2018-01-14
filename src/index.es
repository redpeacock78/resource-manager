/**
 * Resource Manager
 */
export default class ResourceManager
{
	/**
	 * internal types
	 * @typedef {*} ResourceManager_Resource
	 * @typedef {*} ResourceManager_Options
	 * @typedef {function(ResourceManager_Options):ResourceManager_Resource} ResourceManager_OpenFunction
	 * @typedef {function(ResourceManager_Resource)} ResourceManager_CloseFunction
	 * @typedef {{open: ResourceManager_OpenFunction, close: ResourceManager_CloseFunction}} ResourceManager_Functions
	 * @typedef {function()} ResourceManager_CloseWrapperFunction
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
		/** @type {Map<string, ResourceManager_Functions>} */
		this._resourceFunctionsMap = new Map();
		/** @type {Map<string, ResourceManager_Resource>} */
		this._resourceSingletonMap = new Map();
		/** @type {ResourceManager_CloseWrapperFunction[]} */
		this._closeCallbacks = [];
		/** @type {boolean} */
		this._closed = false;
	}

	/**
	 * register resource
	 * @param {string} name
	 * @param {ResourceManager_OpenFunction} open
	 * @param {ResourceManager_CloseFunction} close
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
	 * @param {?ResourceManager_Options} options
	 * @return {ResourceManager_Resource}
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
	 * @param {?ResourceManager_Options} options
	 * @return {ResourceManager_Resource}
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
