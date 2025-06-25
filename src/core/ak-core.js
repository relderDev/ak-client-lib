'use strict';

import { assert, assertFmt, fmt, isDescendant, isElement, isEmpty, isNonEmptyStr, iterateObject, matchText, namedError, sameText } from './ak-utils.js';

/** @this AKObject @param {Boolean} aCondition @param {string} aErrMessage */
function AKObjectAssert(aCondition, aErrMessage = 'Assertion failure.') { assertFmt(aCondition, '[%s] - ' + aErrMessage, this.className); };
/** @param {Element} aElement @param {string[]} aAttributes */
function setCSSFromAttributes(aElement, aAttributes) {
  aAttributes.forEach(function (aAttribute) {
    if (aElement.hasAttribute(aAttribute)) aElement.classList.add('ak-' + aAttribute);
    else aElement.classList.remove('ak-' + aAttribute);
  });
}

/**
 * Abstract "shell" class to enclose all AKClientLib objects (and their common utilities), it should never be instantiated explicitly.
 * 
 * Each AKObject is binded to a DOM element - that is why the constructor requires a element as a parameter.
 * 
 * All methods named with "_" in front of them should be considered *protected* and thus never invoked outside class scope.
 * Methods marked with the **virtual** tag do not throw any error and are there to be implemented by descendants if needed, while the
 * ones marked with the **abstract** do throw error when invoked (thus they have to be overridden).
 */
export class AKObject {
  /** Name of the class (attributed when registering it). @type {string} */
  static className = null;
  /** Assertion function that specifies the class on which it has been invoked. @type {Function} @see {@link assert} */
  static AKAssert = AKObjectAssert.bind(this); 
  /**
   * Checks if this class descends from (or coincides with) the given one.
   * @param {typeof AKObject} aClass 
   * @returns {Boolean}
   */
  static inheritsFrom(aClass) { return isDescendant(this, aClass); }
  /**
   * Returns the specific AKObject class of the given element if it can be represented as an instance of this class, null otherwise.
   * @param {Element} aElement 
   * @returns {typeof AKObject | null}
   * @abstract
   */
  static is(aElement) { throw namedError(fmt('[%s] - Abstracted method "is" called.', this.className), 'AKAbstractError'); };
  /** @type {Element} */
  #EL = null;
  /** Performs some checks upon creation on the element on which the object is created. @param {Element} aElement @virtual */
  _validateElement(aElement) {
    this.constructor.AKAssert(isElement(aElement));
    this.constructor.AKAssert(aElement.id);
  }
  /** Applies class properties and attributes to the element (listeners are added on this step). @param {Element} aElement @virtual */
  _applyClass(aElement) {}
  /** Override this method to perform custom actions after initializing. @virtual */
  _afterInitialization() {}
  /**
   * Creates the AKObject instance.
   * 
   * **Directly creating instances of AKObjects should be avoided.**
   * @param {Element} aElement 
   */
  constructor (aElement) {
    this.constructor.AKAssert(this.constructor.className);
    this._validateElement(aElement);
    this.#EL = aElement;
  }
  /**
   * Initializes the instance, it must be called after each construction.
   * 
   * **Directly creating instances of AKObjects should be avoided.**
   * @returns {AKObject} The instance.
  */
  init() {
    this._applyClass(this.#EL);
    this._afterInitialization();
    return this;
  }
  /** Links to the DOM element */
  get el() { return this.#EL; };
  /** Returns the first AKObject (adequately casted) that contains this, if any. @type {AKObject | null} @abstract */
  get parent() { throw namedError(fmt('[%s] - Abstracted method "parent" called.', this.constructor.className), 'AKAbstractError') };  
}
/**
 * Base class for handling the UI/graphic features.
 */
export class AKUiElement extends AKObject {
  /* ****************** CLASS METHODS ****************** */
  /** CSS class names. @type {string[]} @virtual */
  static get classes() { return []; };
  /** Supported attributes that correspond to CSS classes. @type {string[]} */
  static get supportedAtts() { return ['disabled', 'readonly', 'required', 'invalid', 'hidden']; };
  /** @param {Element} aElement @override */
  static is(aElement) {
    let akClasses = aElement.getListAttribute('ak-ui-classes');
    /** @type {typeof AKUiElement} */
    let akClass;
    for (let i = 0; i < akClasses.length; i++) {
      akClass = AKUiClassesRegistry.instance.find(akClasses[i]);
      if ((akClass) && akClass.inheritsFrom(this)) return akClass;
    }
    return null;
  };
  /* ****************** PROTECTED ****************** */
  /** @param {Element} aElement @override */
  _validateElement(aElement) {
    super._validateElement(aElement);
    this.constructor.AKAssert(matchText(this.constructor.className, aElement.getListAttribute('ak-ui-classes')));
  };
  /** @param {Element} aElement @override */
  _applyClass(aElement) {
    super._applyClass(aElement);
    /// Setup event listeners.
    aElement.classList.add(...this.constructor.classes);
    iterateObject(this._handlers, function (aEventName, aHandler) {
      aElement.addEventListener(aEventName, function (aEvent) {
        aHandler.call(aElement, aEvent);
      }, { signal: AKObjectManager.instance.listenerAdded(aElement) });
    });
    /// Setup CSS classes for boolean attributes (standard and custom ones).
    setCSSFromAttributes(aElement, this.constructor.supportedAtts);
  };
  /** Event handlers (name = event name). @type {Object.<string, EventListener>} @virtual */
  get _handlers() { return {}; };
  /* ****************** PUBLIC ****************** */
  /**
   * Sets an attribute on the element and matches the corrisponding CSS class (if any).
   * @param {string} aAttributeName 
   * @param {string} aAttributeValue 
   */
  setAttribute(aAttributeName, aAttributeValue) {
    this.el.setAttribute(aAttributeName, aAttributeValue);
    if (this.constructor.supportedAtts.contains(aAttributeName))
      setCSSFromAttributes(this.el, [aAttributeName]);
  };
  /** @type {AKUiElement | null} @override */
  get parent() {
    let result = this.el.parentElement;
    /** @type {typeof AKUiElement} */
    let akClass = null;
    while (result) {
      akClass = AKUiElement.is(result);
      if (akClass) return AKObjectManager.instance.get(result, akClass.className);
      result = result.parentElement;
    }
    return null;
  };
};
/**
 * Base class for handling the client-server interactions.
 * **[IN DEVELOPMENT]**
 */
export class AKComponent extends AKObject {
  /* ****************** CLASS METHODS ****************** */
  /** @param {Element} aElement @override */
  static is(aElement) {
    let akClassName = aElement.getAttribute('ak-component-class');
    /** @type {typeof AKComponent} */
    let akClass;
    if (akClassName) {
      akClass = AKComponentRegistry.instance.find(akClassName);
      if ((akClass) && akClass.inheritsFrom(this)) return akClass;
    }
    return null;    
  };
  /* ****************** PROTECTED ****************** */
  /** @param {Element} aElement @override */
  _validateElement(aElement) {
    super._validateElement(aElement);
    this.constructor.AKAssert(sameText(this.constructor.className, aElement.getAttribute('ak-component-class')));
  };
  /* ****************** PUBLIC ****************** */
  /** @type {AKComponent | null} @override */
  get parent() {
    let result = this.el.parentElement;
    /** @type {typeof AKComponent} */
    let akClass = null;
    while (result) {
      akClass = AKComponent.is(result);
      if (akClass) return AKObjectManager.instance.get(result, akClass.className);
      result = result.parentElement;
    }
    return null;
  };
};

/** Registry for AKUiElement classes */
export class AKUiClassesRegistry {
  #ITEMS = {};
  /** @type {AKUiClassesRegistry} */
  static #INSTANCE = null;
  static get instance() {
    if (!this.#INSTANCE)
      this.#INSTANCE = new AKUiClassesRegistry();
    return this.#INSTANCE;
  };
  /**
   * @param {string} aClassName 
   * @returns {typeof AKUiElement | null}
   */
  find(aClassName) {
    if (!isNonEmptyStr(aClassName)) return null;
    return this.#ITEMS[aClassName.toLowerCase()] ?? null;
  };
  /**
   * @param {string} aClassName 
   * @param {typeof AKUiElement} aClass
   */
  register(aClassName, aClass) {
    assert(isNonEmptyStr(aClassName));
    if (this.find(aClassName)) return;
    this.#ITEMS[aClassName.toLowerCase()] = aClass;
    aClass.className = aClassName;
  };
  /**
   * @param {string} aClassName 
   */
  unregister(aClassName) {
    if (!isNonEmptyStr(aClassName)) return;
    delete this.#ITEMS[aClassName.toLowerCase()];
  };
  /**
   * @param {string} aClassName 
   * @returns {typeof AKUiElement} 
   */
  get(aClassName) {
    let result = this.find(aClassName);
    assertFmt(result, '[AKUiClassesRegistry] Class "%s" not found.', aClassName);
    return result;
  };
  /**
   * 
   * @param {string | string[]} aClassName 
   * @returns {Boolean}
   */
  contains(aClassName) {
    if (Array.isArray(aClassName)) {
      for (let i = 0; i < aClassName.length; i++)
        if (!Object.hasOwn(this.#ITEMS, aClassName[i]))
          return false;
      return true;
    }
    return Object.hasOwn(this.#ITEMS, aClassName);
  };
};
/** Registry for AKComponent classes */
export class AKComponentRegistry {
  #ITEMS = {};
  /** @type {AKComponentRegistry} */
  static #INSTANCE = null;
  static get instance() {
    if (!this.#INSTANCE)
      this.#INSTANCE = new AKComponentRegistry();
    return this.#INSTANCE;
  };
  /**
   * @param {string} aClassName 
   * @returns {typeof AKComponent | null}
   */
  find(aClassName) {
    if (!isNonEmptyStr(aClassName)) return null;
    return this.#ITEMS[aClassName.toLowerCase()] ?? null;
  };
  /**
   * @param {string} aClassName 
   * @param {typeof AKComponent} aClass
   */
  register(aClassName, aClass) {
    assert(isNonEmptyStr(aClassName));
    if (this.find(aClassName)) return;
    this.#ITEMS[aClassName.toLowerCase()] = aClass;
    aClass.className = aClassName;
  };
  /**
   * @param {string} aClassName 
   */
  unregister(aClassName) {
    if (!isNonEmptyStr(aClassName)) return;
    delete this.#ITEMS[aClassName.toLowerCase()];
  };
  /**
   * @param {string} aClassName 
   * @returns {typeof AKComponent} 
   */
  get(aClassName) {
    let result = this.find(aClassName);
    assertFmt(result, '[AKComponentRegistry] Class "%s" not found.', aClassName);
    return result;
  };
  /**
   * @param {string | string[]} aClassName 
   * @returns {Boolean}
   */
  contains(aClassName) {
    if (Array.isArray(aClassName)) {
      for (let i = 0; i < aClassName.length; i++)
        if (!Object.hasOwn(this.#ITEMS, aClassName[i]))
          return false;
      return true;
    }
    return Object.hasOwn(this.#ITEMS, aClassName);
  };
};
/**
 *  @typedef {Object} AKRegisteredObject
 *  @property {Object.<string, AKObject>} instances
 *  @property {AbortController[]} controllers
 */
/**
 * Registry for element listeners. For each registered element (id), it holds an array
 * of abort controllers whose signal is binded to a event listener attached to it.
 */
class AKObjectRegistry {
  /** @type {Object.<string, AKRegisteredObject>} */
  #ITEMS = {};
  /**
   * @param {string} aId 
   * @param {typeof AKObject} aClass
   * @returns {Boolean}
   */
  has(aId, aClass) {
    assert(isNonEmptyStr(aId));
    let className = aClass.className;
    if (this.#ITEMS[aId])
      return Boolean(this.#ITEMS[aId].instances[className]);
    return false;
  };
  /**
   * @param {AKObject} aObject
   * @param {string} aId
   * @returns {AKObject}
   */
  register(aObject, aId) {
    assert(aObject);
    assert(isNonEmptyStr(aId));
    let className = aObject.constructor.className;
    let item = this.#ITEMS[aId];
    if (isEmpty(item))
      this.#ITEMS[aId] = { instances: {}, controllers: [] };
    assert(!this.#ITEMS[aId].instances[className]);
    this.#ITEMS[aId].instances[className] = aObject;
    return aObject;
  };
  /**
   * @param {string} aId
   * @param {typeof AKObject} aClass
   * @returns {AKObject}
   */
  getAKObject(aId, aClass) {
    let result = this.#ITEMS[aId].instances[aClass.className];
    assert(result);
    return result;
  }
  /**
   * @param {string} aId 
   * @returns {AbortSignal | null}
   */
  addListenerController(aId) {
    let item = this.#ITEMS[aId];
    assert(item);
    let controller = new AbortController();
    item.controllers.push(controller);
    return controller.signal;
  };
  /**
   * @param {string} aId
   */
  unregister(aId) {
    let item = this.#ITEMS[aId];
    if (!item) return;
    for (let i = 0; i < item.controllers.length; i++)
      item.controllers[i].abort();
    delete this.#ITEMS[aId];
  };
};

export class AKObjectManager {
  /** @type {AKObjectRegistry} */
  #REGISTRY = null;
  /** @type {AKObjectManager} */
  static #INSTANCE = null;
  static get instance() {
    if (!this.#INSTANCE) {
      this.#INSTANCE = new AKObjectManager(true);
    }
    return this.#INSTANCE;
  };
  constructor(aIsDebug = false) {
    this.#REGISTRY = new AKObjectRegistry();
    if(aIsDebug)
      this.registry = this.#REGISTRY;
  };
  /**
   * Returns the registered class instance corresponding to the arguments; a new instance is created if none is found.
   * Throws an error if the element does not be represented as a class instance.
   * @param {Element} aElement 
   * @param {string} aClassName 
   * @returns {AKObject}
   */
  get(aElement, aClassName) {
    assert(isElement(aElement));
    assert(isNonEmptyStr(aElement.id));
    assert(isNonEmptyStr(aClassName));
    /** @type {typeof AKObject} */
    let akClass = null;
    if (sameText(aClassName, aElement.getAttribute('ak-component-class') ?? ''))
      akClass = AKComponentRegistry.instance.get(aClassName);
    if (matchText(aClassName, aElement.getListAttribute('ak-ui-classes')))
      akClass = AKUiClassesRegistry.instance.get(aClassName);
    if (!akClass)
      throw namedError(fmt('Invalid AKObject class %s for element %s.', aClassName, aElement.id), 'AKInvalidTypecast');
    let id = aElement.id.toLowerCase();
    if (this.#REGISTRY.has(id, akClass))
      return this.#REGISTRY.getAKObject(id, akClass);
    return this.#REGISTRY.register(new akClass(aElement), id).init();
  };
  /**
   * Removes the element from the registry.
   * @param {Element} aElement 
   */
  delete(aElement) {
    this.#REGISTRY.unregister(aElement.id.toLowerCase());
  };
  /**
   * Adds the AKLib logic to a plain DOM element if that element supports it.
   * @param {Element} aElement 
   */
  enhance(aElement) {
    if (aElement.hasAttribute('ak-component-class'))
      this.get(aElement, aElement.getAttribute('ak-component-class'));
    let ref = this;
    aElement.getListAttribute('ak-ui-classes').forEach(function (aClassName) {
      ref.get(aElement, aClassName);
    });
  };
  /**
   * Creates an abort controller for the added listener and returns its signal.
   * @param {Element} aElement 
   * @returns {AbortSignal | null}
   */
  listenerAdded(aElement) {
    return this.#REGISTRY.addListenerController(aElement.id.toLowerCase());
  };
};

/**
 * Checks if the string matches the name of a class of an AKObject and, if so, returns the class description.
 * @param {string} aClassName 
 * @returns {Number} 0 = false, 1 = AKComponent, 2 = AKUiElement.
 */
export function isAKClass(aClassName) {
  assert(isNonEmptyStr(aClassName));
  let akClass = AKComponentRegistry.instance.find(aClassName);
  if (akClass) return 1;
  akClass = AKUiClassesRegistry.instance.find(aClassName);
  if (akClass) return 2;
  return 0;
}