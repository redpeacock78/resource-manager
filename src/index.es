/**
 * Resource Manager
 */
export default class ResourceManager
{
	/**
	 * @typedef {*} TypeResource
	 * @typedef {*} TypeResourceOptions
	 * @typedef {function(TypeResourceOptions):TypeResource} TypeResourceOpenFunction
	 * @typedef {function(TypeResource):void} TypeResourceCloseFunction
	 * @typedef {function(void):void} TypeResourceCloseWrapperFunction
	 */
	/**
	 * factory method
	 * @return {ResourceManager}
	 */
	static factory()
	{
		return new ResourceManager();
	}

	/**
	 * constructor
	 */
	constructor()
	{
		/** @type {Map<string, {open: TypeResourceOpenFunction, close: TypeResourceCloseFunction}>} */
		this._resourceFunctionsMap = new Map();
		/** @type {Map<string, TypeResource>} */
		this._resourceSingletonMap = new Map();
		/** @type {TypeResourceCloseWrapperFunction[]} */
		this._closeCallbacks = [];
		/** @type {boolean} */
		this._closed = false;
	}

	/**
	 * register resource
	 * @param {string} name
	 * @param {TypeResourceOpenFunction} open
	 * @param {TypeResourceCloseFunction} close
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
	 * @param {?TypeResourceOptions} options
	 * @return {TypeResource}
	 * @throws {Error}
	 */
	open(name, options = null)
	{
		const resourceFunctions = this._resourceFunctionsMap.get(name);
		if(resourceFunctions === undefined)
		{
			throw new Error(`ResourceManager: resource name "${name}" is unregistered`);
		}

		if(this._closed)
		{
			throw new Error(`ResourceManager: resources are already closed`);
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
	 * @param {?TypeResourceOptions} options
	 * @return {TypeResource}
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

		this._resourceSingletonMap.clear();
		this._closed = true;
	}
}
