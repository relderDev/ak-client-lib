'use strict';

import { AKUiElement, AKUiClassesRegistry } from './ak-core.js';
import { isElement, isNonEmptyStr } from './ak-utils.js';

class AKUiCloseElementButton extends AKUiElement {
  /** @override */
  static get classes() { return ['ak-close-button']; };
  /** @param {Element} aElement @override */
  _applyClass(aElement) {
    super._applyClass(aElement);
    if (!aElement.textContent)
      aElement.textContent = '\xD7';
  };
  /** @type {Object.<string, EventListener>} @override */
  get _handlers() {
    let element = this.el.parentElement;
    this.constructor.AKAssert(element);
    return {
      'click': function(aEvent) {
        element.remove();
        aEvent.stopPropagation();
      }
    };
  };
};
class AKUiCloseAKObjectButton extends AKUiCloseElementButton {
  /** @type {Object.<string, EventListener>} @override */
  get _handlers() {
    let parent = this.parent;
    this.constructor.AKAssert(parent);
    return {
      'click': function(aEvent) {
        if(parent['close']) parent.close(aEvent);
        else parent.el.remove();
        aEvent.stopPropagation();
      }
    };
  };
};

class AKUiTabPanel extends AKUiElement {
  /** @override */
  static get classes() { return ['ak-tabpanel']; };
  /** @type {Element} */
  #HEADER = null;
  /** @type {Element} */
  #BODY = null;
  /** @type {Number} */
  #COUNT = 0;
  /** @type {Number} */
  #ACTIVETAB = -1;

  #activateTab(aTab) {
    if (!isElement(aTab)) return;
    for (let i = 0; i < this.#COUNT; i++) {
      if (aTab === this.#HEADER.children[i]) {
        this.#HEADER.children[i].classList.add('ak-tabpanel-active');
        this.#BODY.children[i].classList.remove('ak-hidden');
        this.#ACTIVETAB = i;
      }
      else {
        this.#HEADER.children[i].classList.remove('ak-tabpanel-active');
        this.#BODY.children[i].classList.add('ak-hidden');
      }
    }
  };
  #setActiveTab() {
    this.#ACTIVETAB = -1;
    if (this.#COUNT > 0) {
      let tabs = this.#HEADER.children;
      for (let i = 0; i < this.#COUNT; i++)
        if (tabs[i].classList.contains('ak-tabpanel-active')) {
          this.#ACTIVETAB = i;
          return;
        }
      this.#activateTab(tabs[this.#COUNT - 1]);
    }
  };
  #tabRemoved(aTab) {
    // this should trigger only when a tab is being removed - the corresponding panel has to be removed.
    if (!isElement(aTab)) return;
    let panelId = aTab.getAttribute('panel-id');
    this.constructor.AKAssert(isNonEmptyStr(panelId));
    for (let i = 0; i < this.#COUNT; i++)
      if (this.#BODY.children[i].id === panelId) {
        this.#BODY.children[i].remove();
        break;
      }
    this.#COUNT--;
    this.#setActiveTab();
  };
  #applyListenersToTab(aTab) {
    let ref = this;
    aTab.addEventListener('click', function (aEvent) { ref.#activateTab(aTab); });
    aTab.addEventListener('destroy', function (aEvent) { ref.#tabRemoved(aTab); });
  };

  /** @param {Element} aElement @override */
  _applyClass(aElement) {
    super._applyClass(aElement);
    this.#HEADER = aElement.getElementsByClassName('ak-tabpanel-header')[0];
    if (!this.#HEADER)
      this.#HEADER = aElement.createChildElement('div', aElement.id + '-hdr', 'ak-tabpanel-header');
    this.#BODY = aElement.getElementsByClassName('ak-tabpanel-body')[0];
    if (!this.#BODY)
      this.#BODY = aElement.createChildElement('div', aElement.id + '-body', 'ak-tabpanel-body');
    this.#COUNT = this.#HEADER.childElementCount;
    this.constructor.AKAssert(this.#COUNT === this.#BODY.childElementCount);
    if (this.#COUNT > 0)
      for (let i = 0; i < this.#COUNT; i++)
        this.#applyListenersToTab(this.#HEADER.children[i]);
    this.#setActiveTab();
  }
  /** @type {Number} */
  get count() { return this.#COUNT; };
  /** @type {Element} */
  get activeTab() { return this.#HEADER.children[this.#ACTIVETAB]; };
  /** @type {Element} */
  get activePanel() { return this.#BODY.children[this.#ACTIVETAB]; };

  /**
   * Adds a tab on the tabpanel and sets the given element as the corresponding panel.
   * @param {string} aTitle 
   * @param {Element} aPanel 
   * @param {Boolean} [aClosable=true]
   */
  addTab(aTitle, aPanel, aClosable = true) {
    this.constructor.AKAssert(isElement(aPanel));
    this.constructor.AKAssert(aPanel.id);
    let tab = this.#HEADER.createChildElement('div', aPanel.id + '-tab', 'ak-tabpanel-tab', { 'panel-id': aPanel.id });
    aPanel.setAttribute('tab-id', tab.id);
    this.#BODY.appendChild(aPanel);    
    tab.innerText = aTitle ?? '\xA0';
    if (aClosable)
      tab.createChildAKObject('div', tab.id + '-close', 'CloseElementButton');
    this.#COUNT++;
    this.#activateTab(tab);
    this.#applyListenersToTab(tab);
  };
};

class AKUiTestButton extends AKUiElement {
  /** @override */
  static get classes() {
    return ['ak-button', 'ak-test-add-tab'];
  }
  /** @type {Object.<string, EventListener>} @override */
  get _handlers() {
    let parent = this.parent;
    return {
      'click': function (aEvent) {
        let random = Math.floor(Math.random() * 1000);
        let panel = parent.el.ownerDocument.createElement('div');
        panel.id = 'test-' + random;
        panel.classList.add('ak-panel', 'ak-container');
        parent.addTab('Titolo ' + random, panel, true);
      }
    };
  };  
}

AKUiClassesRegistry.instance.register('CloseElementButton', AKUiCloseElementButton);
AKUiClassesRegistry.instance.register('CloseAKObjectButton', AKUiCloseAKObjectButton);
AKUiClassesRegistry.instance.register('TabPanel', AKUiTabPanel);
AKUiClassesRegistry.instance.register('TestButton', AKUiTestButton);