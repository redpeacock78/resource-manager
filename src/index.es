/**
 * Resource Manager
 */
export default class ResourceManager
{
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
		this._resourceFunctionsMap = {};
		this._resourceSingletonMap = {};
		this._closeCallbacks = [];
		this._closed = false;
	}

	/**
	 * register resource
	 * @param {string} name
	 * @param {function(*):*} open
	 * @param {function(*):void} close
	 * @return {ResourceManager}
	 */
	register(name, open, close)
	{
		this._resourceFunctionsMap[name] = {
			open: open,
			close: close,
		};
		return this;
	}

	/**
	 * open a resource
	 * @param {string} name
	 * @param {?*} options
	 * @return {*}
	 * @throws {Error}
	 */
	open(name, options = null)
	{
		const resourceFunctionsMap = this._resourceFunctionsMap;
		if(!resourceFunctionsMap.hasOwnProperty(name))
		{
			throw new Error(`ResourceManager: resource name "${name}" is unregistered`);
		}

		if(this._closed)
		{
			throw new Error(`ResourceManager: resources are already closed`);
		}

		const resourceFunctions = resourceFunctionsMap[name];
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
	 * @param {?*} options
	 * @return {*}
	 * @throws {Error}
	 */
	openSingleton(name, options = null)
	{
		const key = JSON.stringify([name, options]);

		const resourceSingletonMap = this._resourceSingletonMap;
		if(!resourceSingletonMap.hasOwnProperty(key))
		{
			resourceSingletonMap[key] = this.open(name, options);
		}
		return resourceSingletonMap[key];
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

		this._resourceSingletonMap = {};
		this._closed = true;
	}
}
