/**** GLOBAL UTILITY FUNCTIONS
 * This module exports utility functions documented via JSDoc, as each exported function should be.
 * All function definitions follow a clear naming convention: it's quite simple, please stick to it.
 * The only one that can be go unnoticed is the suffix "Sync" to functions that return promises:
 * It can be handy for the dev knowing when to use "await" or ".then" without having to look at the code.
 */
'use strict';

/* ******************************** NON-EXPORTED FUNCTIONS ******************************** */
function spliceString(aString, aStart, aCount, aReplace = '') {
  if (aStart < 0) aStart = 0;
  return aString.slice(0, aStart) + String(aReplace) + aString.slice(aStart + aCount);
}

function getResolveCallback(aResolveFunction, aCallbackArgs, aResolveValue) {
  return function (...args) {
    if (aResolveValue === undefined) {
      if (args.length === 1)
        return aResolveFunction(args[0])
      return aResolveFunction(args);
    }
    args.forEach(function (arg) { aCallbackArgs.push(arg); });
    return aResolveFunction(aResolveValue);
  }
}
function promisify(aFunction, aHasFailCallback, aCallbackArgs, ...args) {
  assert(typeof(aFunction) === 'function');
  assert(Array.isArray(aCallbackArgs));
  aCallbackArgs.length = 0;
  if (aHasFailCallback)
    return new Promise(function (resolve) {
      aFunction(
        getResolveCallback(resolve, aCallbackArgs, true),
        getResolveCallback(resolve, aCallbackArgs, false),
        ...args
      );
    });
  return new Promise(function (resolve) {
    aFunction(
      getResolveCallback(resolve, aCallbackArgs),
      ...args
    );
  });
}
/* ******************************** STRING MANIP FUNCTIONS ******************************** */
/**
 * Formats the string putting given values in place of the '%s' symbol.
 * Each non-string value of aValues will be simply casted as string.
 * @param {string} aString 
 * @param  {...(string | number | boolean)} aValues 
 * @returns {string}
 * 
 * I just really hate using ` because I am italian and italian keyboards do not have backtick.
 */
export function fmt(aString, ...aValues) {
  let result = aString;
  let pos = result.indexOf('%s');
  while (pos > -1) {
    assert(aValues.length > 0, 'Not enough values to format string.');
    result = spliceString(result, pos, 2, aValues.shift());
    pos = result.indexOf('%s');
  }
  return result;
}
/* ******************************** ERROR RELATED FUNCTIONS ******************************** */
/**
 * Creates a new named error.
 * @param {string} aMessage 
 * @param {string} aName 
 * @returns {Error}
 */
export function namedError(aMessage, aName) {
  let err = new Error(aMessage);
  if (isNonEmptyStr(aName))
    err.name = aName;
  return err;
}
/**
 * Check a condition and throws an error is it evaluates to false.
 * @param {boolean} aCondition The condition
 * @param {string} aErrMessage The optional error message
 */
export function assert(aCondition, aErrMessage = 'Assertion failure.') {
  if (!aCondition)
    throw namedError(aErrMessage, 'AssertionFailure');
}
/**
 * Check a condition and throws a formatted error message is it evaluates to false.
 * @param {boolean} aCondition The condition
 * @param {string} aErrMessage The error message
 * @param  {...(string | number | boolean)} aValues The list of values to format the error message with
 */
export function assertFmt(aCondition, aErrMessage, ...aValues) {
  assert(aCondition, fmt(aErrMessage, ...aValues));
}
/**
 * Check a condition and throws the given error if it evaluates to false.
 * @param {boolean} aCondition 
 * @param {Error} aError 
 */
export function assertErr(aCondition, aError) {
  if (!aCondition)
    throw aError;
}
/* ******************************** VARIOUS CHECK FUNCTIONS ******************************** */
/**
 * Checks if two strings match - case insensitive.
 * Throws an error when one or both arguments are not strings.
 * @param {string} aFirst 
 * @param {string} aSecond 
 * @returns {boolean}
 */
export function sameText(aFirst, aSecond) {
  assert(typeof(aFirst) === 'string');
  assert(typeof(aSecond) === 'string');
  return aFirst.toUpperCase() === aSecond.toUpperCase();
}
/**
 * Checks if a string is contained in a string array - case insensitive.
 * Throws an error when aValues is not an array, when aString is not a string
 * or when aValues contains non-string values.
 * @param {string} aString
 * @param {string[]} aValues 
 * @returns {boolean}
 */
export function matchText(aString, aValues) {
  assert(Array.isArray(aValues));
  for (let i = 0; i < aValues.length; i++)
    if (sameText(aString, aValues[i])) return true;
  return false;
}
/**
 * Evaluates a condition and returns the corrisponding given value.
 * @param {boolean} aCondition 
 * @param {*} aTrueValue 
 * @param {*} aFalseValue 
 * @returns {*}
 */
export function ifThen(aCondition, aTrueValue, aFalseValue = null) {
  if (aCondition)
    return aTrueValue;
  return aFalseValue;
}
/**
 * Checks if a function with the given name has been defined.
 * @param {string} aName The name of the function
 * @returns {boolean}
 */
export function fnExists(aName) {
  return (typeof(window[aName]) === 'function');
}
/**
 * Checks if the passed argument is a DOM element.
 * @param {*} aElement
 * @returns {boolean}
 */
export function isElement(aElement) {
  return aElement instanceof Element || aElement instanceof Document;  
}
/**
 * Tests if a object/value is empty. It works like (!aValue) but covering {} and [].
 * @param {any} aValue The object/value to test
 * @returns {boolean}
 */
export function isEmpty(aValue) {
  if (!aValue) return true;
  if ((aValue.constructor === Object) && (Object.keys(aValue).length === 0)) return true;
  if ((aValue.constructor === Array) && (aValue.length === 0)) return true;
  return false;
}
/**
 * Tests if the passed argument is a string and if it is not empty.
 * @param {any} aString The value to test
 * @returns {boolean}
 */
export function isNonEmptyStr(aString) {
  return ((aString) && (typeof(aString) === 'string'));
}
/**
 * Tests if the passed argument is a number and if it is not NaN.
 * @param {number} aNumber The value to test
 * @returns {boolean}
 */
export function isValidNumber(aNumber) {
  return (typeof(aNumber) === 'number') && (!Number.isNaN(aNumber));
}
/**
 * Returns whether or not a class is descendant of another.
 * @param {ObjectConstructor} aClass 
 * @param {ObjectConstructor} aParentClass 
 * @returns {Boolean}
 */
export function isDescendant(aClass, aParentClass) {
  return (aClass == aParentClass) || (aClass.prototype instanceof aParentClass);
}
/* ******************************** JS/DOM ENHANCEMENTS ******************************** */
/**
 * Modulo operation that works with negative numbers.
 * @param {Number} aNumber 
 * @param {Number} aModulo 
 * @returns {Number}
 */
export function modulo(aNumber, aModulo) {
  return ((aNumber % aModulo) + aModulo) % aModulo;
}
/**
 * Returns a string array with the values of the given token-list attribute
 * @param {Element} aElement 
 * @param {string} aAttributeName 
 * @returns {string[]}
 */
export function listAttribute(aElement, aAttributeName) {
  let att = aElement.getAttribute(aAttributeName);
  if (!att) return [];
  return att.split(' ');
}
/**
 * Creates a element on the same document as the given one and appends the new one on it.
 * @param {Element} aParent The parent element
 * @param {string} aTagName The tag of the new element
 * @param {string} aId The id of the new element
 * @param {string} aClasses The list of CSS classes separated by space
 * @param {Object.<string, string | number | boolean>} aAttributes The node attributes
 * @returns {Element} The child element
 */
export function createAndAppendChild(aParent, aTagName, aId, aClasses, aAttributes = {}) {
  assert(isElement(aParent));
  assert(isNonEmptyStr(aTagName));
  let child = aParent.ownerDocument.createElement(aTagName);
  if (isNonEmptyStr(aId)) child.id = aId;
  if (isNonEmptyStr(aClasses)) child.setAttribute('class', aClasses);
  if (!isEmpty(aAttributes))
    iterateObject(aAttributes, function (aKey, aValue) { child.setAttribute(aKey, aValue); });
  return aParent.appendChild(child);
}
/**
 * Iterates on own properties of a given object and calls the given function passing
 * key and value as arguments - skips prototype's properties and NaNs.
 * @param {object} aObject The object to iterate on
 * @param {function} aFunction The function to call for each property
 * @param {boolean} [aDeep=false] When true iterates also on non-array object properties
 */
export function iterateObject(aObject, aFunction, aDeep = false) {
  assert(typeof(aObject) === 'object');
  assert(typeof(aFunction) === 'function');
  let value = null;
  for (let key in aObject) {
    if (!aObject.hasOwnProperty(key)) continue; // Skip proto's properties
    value = aObject[key];
    if (Number.isNaN(value)) continue; // Skip NaNs
    if ((typeof(value) === 'object') && !Array.isArray(value) && aDeep)
      iterateObject(value, aFunction, aDeep);
    else
      aFunction(key, value);
  }
}
/**
 * Transforms an object into a string of url params of the form 'key=value' separated by "&".
 * Arrays get transformed into strings like '0=arr[0]&1=arr[1]&...'.
 * Each non-string, non-number, non-boolean property of the object is skipped.
 * No formatting is done on strings in order to prevent invalid URL characters {TODO}.
 * @param {object | array} aObject 
 * @param {string[]} aExclude Excluded keys
 * @returns {string} The url params
 */
export function objToURLQuery(aObject, aExclude = []) {
  let acceptedTypes = ['string', 'number', 'boolean'];
  let params = [];
  iterateObject(aObject,
    function(aKey, aValue) {
      if (!acceptedTypes.includes(typeof(aValue))) return; // Skip non serializable types
      if (aExclude.includes(aKey)) return; // Skip excluded
      params.push(aKey + '=' + aValue);
    }
  );
  return params.join('&');
}
/**
 * Returns a copy of aSource where each "flat" property (strings, numbers and booleans) is kept as it is,
 * object and array properties are serialized via JSON.stringify, all other properties are skipped.
 * If aSource itself is an array it is converted to a simple object with the original indexes as keys.
 * @param {object | array} aSource The object to copy from
 * @example
 * flattenObject({ first: 'foo', second: null, third: 50, fourth: { bar: true }}) => { first: 'foo', third: 50, fourth: '{ "bar": true }' }
 * @example
 * flattenObject(['foo', null, 50, { bar: true }]) => { 0: 'foo', 2: 50, 3: '{ "bar": true }' }
 */
export function flattenObject(aSource) {
  assert(typeof(aSource) === 'object');
  let acceptedTypes = ['string', 'number', 'boolean', 'object'];
  let result = {};  
  for (let key in aSource) {
    if (!aSource.hasOwnProperty(key)) continue; // Skip proto's properties
    if (!acceptedTypes.includes(typeof(aSource[key]))) continue; // Skip non serializable types
    if (Number.isNaN(aSource[key])) continue; // Skip NaNs
    if (typeof(aSource[key]) != 'object') result[key] = aSource[key]; // Plain property
    else result[key] = JSON.stringify(aSource[key]); // Object/Array
  }
  return result;
}
/**
 * Returns the first non-empty argument (see isEmpty method). Returns undefined when no,
 * argument is given, returns null when all given arguments are empty.
 * @param  {...any} aValues Values to check
 * @returns {any | null | undefined}
 */
export function coalesce(...aValues) {
  if (aValues.length === 0) return;
  for (let i = 0; i < aValues.length; i++)
    if (!isEmpty(aValues[i])) return aValues[i];
  return null;
}
/**
 * Add the given value to the given array only if it does not contain that value(s) already.
 * @param {Array} aArray 
 * @param {any | any[]} aValue 
 * @returns {number} The new length of the array
 */
export function pushIfNew(aArray, aValue) {
  assert(Array.isArray(aArray));
  if (Array.isArray(aValue))
    aValue.forEach(function (item) { pushIfNew(aArray, item); });
  else if (!aArray.includes(aValue))
    aArray.push(aValue);
  return aArray.length;
}
/**
 * Converts a HTML formatted string into a HTMLCollection of Element and iterates through it,
 * passing each element to the given function as argument.
 * @param {string} aHtml The HTML string
 * @param {function(Element): void} aFunction
 * @throws When aHtml is not a string.
 */
export function stringToHtml(aHtml, aFunction) {
  assert(typeof(aHtml) === 'string');
  aHtml = aHtml.trim();
  let template = window.document.createElement('template');
  template.innerHTML = aHtml;
  let collection = template.content.children;
  for (let element of collection)
    aFunction(element);
  template.remove();
  // This functional approach is preferred in order to avoid polluting the shadow DOM.
}
/* ******************************** PROMISE-BASED FUNCTIONS ******************************** */
/**
 * Sleeps.
 * @param {number} aDuration The sleep-time in milliseconds
 * @returns {Promise<void>}
 */
export function sleepSync(aTimeout) {
  return new Promise(function (resolve) { setTimeout(resolve, aTimeout); });
}
/**
 * Synchronizes the usual setTimeout function and awaits for it.
 * @param {Function} aHandler The function to be called on timeout
 * @param {number} aTimeout The timeout interval in milliseconds
 * @param  {...any} [args] Arguments passed to the handler function
 * @returns {*} The return value of the handler function
 */
export function timeoutSync(aHandler, aTimeout, ...args) {
  return new Promise(function (resolve) { setTimeout(function() { resolve(aHandler(...args)) }, aTimeout); });
}
/**
 * Synchronizes a triggered event.
 * @param {string} aEventName The event's name
 * @returns {Promise<Event>}
 */
export function eventSync(aEventName) {
  return new Promise(function (resolve) {
    const listener = function(aEvent) {
      window.document.removeEventListener(aEventName, listener);
      resolve(aEvent);
    }
    window.document.addEventListener(aEventName, listener);
  });
}
/**
 * Synchronizes a function that receives a callback as its first argument.
 * @param {Function} aFunction The function that calls the callback
 * @param  {...any} args Any subsequent argument that aFunction may need
 * @returns {Promise<any | any[]>} Array containing each argument passed to the callback function (if it's just one argument is not returned as an array)
 * @example
 * // readPersonData(CB(firstname, lastname, birthdate)) 
 * let data = await promisifySync(readPersonData, 'some-id-value');
 * console.log(`First Name: ${data[0]}, Last Name: ${data[1]}, Birthdate: ${data[2]}`);
 */
export function promisifySync(aFunction, ...args) {
  return promisify(aFunction, false, [], ...args);
}
/**
 * Synchronizes a function that receives a success callback as its first argument and a fail callback as its second argument. 
 * @param {Function} aFunction The function that calls the callbacks
 * @param {any[]} aCallbackArguments **OUTPUT** array containing each argument passed to the invoked callback
 * @param  {...any} args Any subsequent argument that aFunction may need
 * @returns {Promise<Boolean>} Which of the callbacks has been triggered (true=Success, false=Fail)
 * @example
 * // openDatabase(successCB(sessionID), failCB(error), username, password)
 * let result = [];
 * if (await promisifySuccessFailSync(openDatabase, result, 'myUser', 'myPassword'))
 *   console.log(`Database successfully opened (${result[0]})`);
 * else
 *   console.log(`Could not open database: ${result[0]}`);
 */
export function promisifySuccessFailSync(aFunction, aCallbackArguments, ...args) {
  return promisify(aFunction, true, aCallbackArguments, ...args);
}