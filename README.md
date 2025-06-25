
  
# AKClientLib

**AKClientLib** is a lightweight, declarative JavaScript library that lets you enhance your HTML with ready-to-use UX components - no build tools, no frameworks, just a few extra attributes.

Think of it as a minimal, extensible system that enhances your HTML, inspired by libraries like [HTMX](https://htmx.org/), but with a built-in library of behaviors and components.

## Why AKClientLib?

- ✅ **Zero configuration** --- Just include `ak-init.js` in the `<head>` (along with all of the [desired CSS files](./css)) and go.
- ✅ **Declarative HTML-first syntax** --- Add UI behaviour via `ak-ui-classes` attribute and AJAX behaviour with `ak-component-*` attributes. 
- ✅ **Tiny footprint** --- No dependencies, no bundlers.
- ✅ **Extendable** --- Easily register your own components in pure JS.
- ✅ **Framework-agnostic** --- Works with server-rendered pages, CMS templates, or even static HTML.

## 📦 Installation

Copy the library files to your project, then include the init script in your HTML:

```html
<script src="path/to/ak-init.js"></script>
```

To use the bundled styles, include the following

```html
<link rel="stylesheet" href="path/to/css/ak-main.css"/>
<link rel="stylesheet" href="path/to/css/ak-main-vars.css"/>
<!-- and any other desired file under path/to/css -->
```

## Example Usage

This [example](example.html) shows how to add UI features just declaring the `ak-ui-classes` attribute on an element and how those work (with a little help from custom JavaScript to make use of them).

## Core Concepts

**AKClientLib** is built around **AKUiElement** and **AKComponent** classes that bind behavior to DOM elements via attributes and IDs.

- Every enhanced element **must have a unique ID**.
- Behavior is triggered and controlled via `ak-*` attributes.
- Components can register lifecycle logic (`_afterInitialization` method, `destroy` event, etc).

**AKUiElement** classes add client-side UI (such as switching tabs, incrementing counters, show popups, etc.) to the DOM elements, while **AKComponent** classes handle the AJAX exchanges with the back-end (if any). 

Similar to CSS classes, a DOM element can be bound to multiple different **AKUiElement** classes (inheriting all of their UI enhancements); only one **AKComponent** class can be bound to it, though.

Including this library as a "pure element library" with no use of **AKComponent** classes is perfectly possible.

## 📐 Design Philosophy

- **HTML is the source of truth** --- The goal is to empower designers and devs to build behavior-rich interfaces using familiar tools and the declarative power of HTML.
- **Minimal assumptions** --- **AKClientLib** assumes only that your elements have IDs and attributes; no virtual DOM, no state reactivity system.
- **Extendable** --- Power users can write their own logic using JavaScript, but it's never required to get started.

## Extending AKClientLib

Want to define your own elements? It's extremely simple, just edit [this file](./src/ak-ui-elements.js)

```js
class MyCustomUiElement extends AKUiElement {
  _afterInitialization() {
    console.log('Component ready!');
  }
}

AKUiClassesRegistry.instance.register('MyCustomElement', MyCustomUiElement);
```

And in your HTML:

```html
<div id="custom" ak-ui-classes="MyCustomElement"></div>
```

Extending components works exactly the same way, the only caveat being implementing it in [this file instead](./src/ak-components.js) and registering it on `AKComponentRegistry.instance`.

## ⚠️ Things to Know

- All enhanced elements must have a **unique `id`**.
- Component class names must be registered manually (no magic auto-discovery).
- Prototype extensions (`Element.prototype`) are used for convenience (but will soon be namespace functions attached to the Element protype only in a optional module)
- The library doesn't use TypeScript — however, all public APIs are fully documented using JSDoc.

## License

All of the **AKClientLib** code code is distributed under the terms of the [**Apache License 2.0**](./LICENSE).

## 🧪 Want to contribute?

PRs, ideas, and feature suggestions are welcome! Feel free to open a issue, a discussion or just contact me [here](https://x.com/RelderVGC).
