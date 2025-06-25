'use strict';

import { assert, createAndAppendChild, listAttribute } from './ak-utils.js';
import { AKObject, AKObjectManager, isAKClass } from './ak-core.js';

/**
 * @type {MutationCallback}
 */
function observeDestroy(aMutationList, aObserver) {
  for (let mutation of aMutationList)
    if (mutation.type === 'childList')
      mutation.removedNodes.forEach(function (aNode) {
        if (aNode.nodeType === Node.ELEMENT_NODE) {
          aNode.dispatchEvent(new CustomEvent('destroy'));
          AKObjectManager.instance.delete(aNode);
        }
      });
};
/**
 * Starts a mutation observer that triggers the destroy event for removed DOM nodes.
 * @param {Node} aTargetNode The root node that will be observed
 * @returns The observer instance
 */
export function startDestroyObserver(aTargetNode) {
  let observer = new MutationObserver(observeDestroy);
  observer.observe(aTargetNode, { childList: true, subtree: true });
  return observer;
}
/**
 * Casts the given element and all of its children as all the corresponding AKLib classes.
 * @param {Element} aElement 
 */
export function enhanceElement(aElement) {
  AKObjectManager.instance.enhance(aElement);
  if (aElement.childElementCount > 0)
    for (let child of aElement.children)
      enhanceElement(child);
}

/**
 * Get the AKObject class instance from a DOM element, useful to access additional element properties.
 * If an AKObject of the given class cannot be created from the specified element it throws an error.
 * @this Element The element to be casted
 * @param {string} aClassName A valid name of an AKObject class
 * @returns {AKObject} The newly created AKObject class instance
 */
function asAKObject(aClassName) { return AKObjectManager.instance.get(this, aClassName); };
Element.prototype.asAKObject = asAKObject;

/**
 * Returns an array filled with the value splitted by a space of element's first attribute whose qualified name is aQualifiedName.
 * If there is no such attribute an empty array is returned.
 * @this Element The element
 * @param {string} aQualifiedName
 * @returns {string[]}
 */
function getListAttribute(aQualifiedName) { return listAttribute(this, aQualifiedName); };
Element.prototype.getListAttribute = getListAttribute;

/**
 * Creates and appends a child element to the element.
 * @this Element The parent element
 * @param {string} aTagName The tag of the new element
 * @param {string} aId The id of the new element
 * @param {string} aClasses The list of CSS classes separated by space
 * @param {Object.<string, string | number | boolean>} aAttributes The node attributes
 * @returns {Element} The child element
 */
function createChildElement(aTagName, aId, aClasses, aAttributes = {}) { return createAndAppendChild(this, aTagName, aId, aClasses, aAttributes); };
Element.prototype.createChildElement = createChildElement;

/**
 * Creates and appends a child element to the element and casts it as an AKObject.
 * @this Element the parent element
 * @param {string} aTagName The tag of the new element
 * @param {string} aId The id of the new element
 * @param {string} aClassName AKObject class name
 * @param {Object.<string, string | number | boolean>} aAttributes The node attributes
 * @returns {AKObject} The instance of the AKObject
 */
function createChildAKObject(aTagName, aId, aClassName, aAttributes = {}) {
  let classDesc = isAKClass(aClassName);
  assert(classDesc);
  let el = createAndAppendChild(this, aTagName, aId, '', aAttributes);
  if (classDesc === 1)
    el.setAttribute('ak-component-class', aClassName);
  else
    el.setAttribute('ak-ui-classes', aClassName);
  return AKObjectManager.instance.get(el, aClassName);
}
Element.prototype.createChildAKObject = createChildAKObject;