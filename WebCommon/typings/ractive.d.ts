// Type definitions for Ractive 0.7.1
// Project: http://ractivejs.org
// Definitions by: Han Lin Yap <http://yap.nu>
// Definitions: https://github.com/codler/Ractive-TypeScript-Definition
// Version: 0.7.1-1+2015-03-21

interface Static {
  new (options: NewOptions): IRactive;
  
  extend(options: ExtendOptions): Static;
  
  // Since 0.7.1
  getNodeInfo(node: HTMLElement): NodeInfo;

  parse(template: string, options?: ParseOptions): any;

  // TODO: undocumented
  adaptors: AdaptorPlugins;

  // TODO: undocumented
  components: ComponentPlugins;

  // Since 0.7.1
  DEBUG: boolean;

  defaults: DefaultsOptions;

  // TODO: undocumented
  decorators: DecoratorPlugins;

  easing: { [key: string]: (x: number) => number; };

  // TODO: undocumented
  events: EventPlugins;

  // TODO: missing static properties documentation
  partials: { [key: string]: any; };

  // Undocumented method
  Promise: Promise<void>;

  // TODO: missing static properties documentation
  transitions: TransitionPlugins;
}

// interface Node extends HTMLElement {
//     _ractive: any;
// }

interface AnimationPromise extends Promise<void> {
    stop(): void; // TODO: void?
}

interface AdaptorPlugin extends Object {
    // TODO: 
}

interface ComponentPlugin extends Static {
    // TODO: 
}

interface DecoratorPlugin {
    (node: HTMLElement, ...args: any[]): {
        // TODO: undocumented GH-429
        update?: (...args: any[]) => void;
        teardown: () => void;
    }
}

interface EventPlugin extends Function {
    // TODO: 
}

interface TransitionPlugin {
    (t: Transition, params: Object): void;
}

interface AdaptorPlugins {
    [key: string]: AdaptorPlugin;
}

interface ComponentPlugins {
    [key: string]: ComponentPlugin;
}

interface DecoratorPlugins {
    [key: string]: DecoratorPlugin;
}

interface EventPlugins {
    [key: string]: EventPlugin;
}

interface TransitionPlugins {
    [key: string]: TransitionPlugin;
}

interface Event {
    context: any;
    component?: IRactive;
    index: { [key: string]: number };
    keypath: string;
    // Since 0.6.0
    name: string;
    node: HTMLElement;
    original: Event;
}

// Since 0.7.1
interface NodeInfo {
  ractive: IRactive;
  keypath: string;
  index: { [key: string]: number };
}

// Return value in ractive.observe and ractive.on
interface Observe {
    cancel(): void;
}

// Comes as first parameter in RactiveTransitionPlugin
interface Transition {
    isIntro: boolean;
    name: string;
    node: HTMLElement;

    animateStyle(prop: string, value: any, options: TransitionAnimateOptions, complete: Function): void;
    animateStyle(props: Object, options: TransitionAnimateOptions, complete: Function): void;
    // Default false
    complete(noReset?: boolean): void;
    getStyle(prop: string): string;
    getStyle(props: string[]): Object;
    processParams(params: any, defaults?: Object): Object;
    resetStyle(): void;
    setStyle(prop: string, value: any): Transition;
    setStyle(props: Object): Transition;
}

interface TransitionAnimateOptions {
    // TODO: Do it have default value?
    duration: number;
    // Any valid CSS timing function
    // Default 'linear'
    easing?: string;
    // TODO: Do it have default value?
    delay: number;
}

interface AnimateOptions {
    duration?: number;
    easing?: string | Function;
    // TODO: number as type correct?
    step?: (t: number, value: number) => void; // TODO: void?
    // TODO: number as type correct?
    complate?: (t: number, value: number) => void; // TODO: void?
}

interface ObserveOptions extends ObserveOnceOptions {
    // Default true
    init?: boolean;
}

// Since 0.7.1
interface ObserveOnceOptions {
    // Default Ractive
    context?: any;
    // Default false
    defer?: boolean;
}

// Used in Ractive.parse options
interface ParseOptions {
    preserveWhitespace: boolean;
    sanitize: any;
}

// Used in Initialisation options
interface SanitizeOptions {
    elements: string[];
    // TODO: Undocumented what default value is, but probably false
    eventAttributes?: boolean;
}

interface NewOptions {
  /*
    * @type List of mixed string or Adaptor
    */
    adapt?: (string | AdaptorPlugin)[];

    adaptors?: AdaptorPlugins;

  /**
    * Default false
    * @type boolean or any type that option `el` accepts (HTMLElement or String or jQuery-like collection)
    */
    append?: boolean | any;

    complete?: Function;
    components?: ComponentPlugins;
    computed?: Object;
    // Since 0.5.5
    // TODO: unclear in documantation, should this be in ExtendOptions instead?
    css?: string;

  /**
    * @type Object or Function
    */
    // TODO: undocumented type Function
    data?: Object | Function;

    decorators?: DecoratorPlugins;
  /**
    * @type [open, close]
    */
    delimiters?: string[];

// TODO: unsure
    easing?: string | Function;

  /**
    * @type HTMLElement or String or jQuery-like collection
    */
    el?: string | HTMLElement | any;
    // TODO: undocumented in Initialisation options page
    events?: EventPlugins;

    // Since 0.5.5
    // TODO: unclear in documantation
    interpolators?: { [key: string]: any; };

    // Since 0.6.0
// TODO: undocumented arguments
    onchange?: (options: NewOptions) => void; // TODO: void?
    // Since 0.6.0
// TODO: undocumented arguments
    oncomplete?: () => void; // TODO: void?
    // Since 0.6.0
// TODO: undocumented arguments
    onconfig?: () => void; // TODO: void?
// Since 0.6.0
// TODO: undocumented arguments
    onconstruct?: (options: NewOptions) => void; // TODO: void?
// Since 0.6.0
// TODO: undocumented arguments
    ondetach?: () => void; // TODO: void?
// Since 0.6.0
// TODO: undocumented arguments
    oninit?: () => void; // TODO: void?
// Since 0.6.0
// TODO: undocumented arguments
    oninsert?: () => void; // TODO: void?
    // Since 0.6.0
// TODO: undocumented arguments
    onrender?: () => void; // TODO: void?
// Since 0.6.0
// TODO: undocumented arguments
    onunrender?: () => void; // TODO: void?
// Since 0.6.0
// TODO: undocumented arguments
    onupdate?: () => void; // TODO: void?
// Since 0.6.0
// TODO: undocumented arguments
    onteardown?: () => void; // TODO: void?

  /**
    * any is same type as template
    */
    partials?: { [key: string]: any; };
  /**
    * Default false
    */
    sanitize?: boolean | SanitizeOptions;
  /**
    * Default ['[[', ']]']
    * @type [open, close]
    */
    staticDelimiters?: string[];
  /**
    * Default ['[[[', ']]]']
    * @type [open, close]
    */
    staticTripleDelimiters?: string[];
  /**
    * @type String or (if preparsing "Ractive.parse") Array or Object
    */
    template?: any;
    transitions?: TransitionPlugins;
  /**
    * @type [open, close]
    */
    tripleDelimiters?: string[];

    // Default false
    lazy?: boolean;
    // Default false
    magic?: boolean;
    // Default true
    modifyArrays?: boolean;
    // Since 0.5.5
    // TODO: unclear in documentation
    // Default false
    noCSSTransform?: boolean;
    // Default false
    noIntro?: boolean;
    // Default false
    preserveWhitespace?: boolean;
    // Since 0.5.5
    // Default true
    stripComments?: boolean;
    // Since 0.7.1
    // Default true
    transitionsEnabled?: boolean;
    // Default true
    twoway?: boolean;
}

interface ExtendOptions extends NewOptions {
    /**
      * @deprecated
      */
    beforeInit?: (options: ExtendOptions) => void;
    /**
      * @deprecated
      */
    init?: (options: ExtendOptions) => void;

    // Default false, inherit from Ractive.defaults
    isolated?: boolean;
}

// See ractive change log "All configuration options, except plugin registries, can be specified on Ractive.defaults and Component.defaults"
interface DefaultsOptions extends ExtendOptions {
    /**
      * @deprecated since 0.7.1
      */
    // Default false
    debug?: boolean;
}

/**
  * The Ractive instance members
  */
interface IRactive {
    add(keypath: string, number?: number): Promise<void>;

    animate(keypath: string, value: any, options?: AnimateOptions): AnimationPromise;

    animate(map: Object, options?: AnimateOptions): AnimationPromise;

    detach(): DocumentFragment;

    find(selector: string): HTMLElement;

    // live default false
    findAll(selector: string, options?: { live: boolean }): HTMLElement[];

    // live default false
    findAllComponents(name: string, options?: { live: boolean }): IRactive[];
    // TODO: maybe exist, in that case it is undocumented
    // findAllComponents(): Ractive[]

    findComponent(name?: string): IRactive;

    // Since 0.7.1
    findContainer(name: string): IRactive; // TODO: Ractive?
    
    // Since 0.7.1
    findParent(name: string): IRactive; // TODO: Ractive?

    fire(eventName: string, ...args: any[]): void; // TODO: void?

    get(keypath: string): any;
    get(): Object; // TODO: Object?

    // target - Node or String or jQuery (see Valid selectors)
    // anchor - Node or String or jQuery
    insert(target: any, anchor?: any): void; // TODO: void?
    
    merge(keypath: string, value: any[], options?: { compare: boolean | string | Function }): Promise<void>;

    // callback context Ractive
    observe(keypath: string, callback: (newValue: any, oldValue: any, keypath: string) => void, options?: ObserveOptions): Observe;
    observe(map: Object, options?: ObserveOptions): Observe;

    // Since 0.7.1
    observeOnce(keypath: string, callback: (newValue: any, oldValue: any, keypath: string) => void, options?: ObserveOnceOptions): Observe;

    // handler context Ractive
    off(eventName?: string, handler?: (event?: Event | any, ...args: any[]) => any): IRactive;
    on(eventName: string, handler: (event?: Event | any, ...args: any[]) => any): Observe;
    on(map: { [eventName: string]: (event?: Event | any, ...args: any[]) => any }): Observe;

    // Since 0.7.1
    once(eventName: string, handler: (event?: Event | any, ...args: any[]) => any): Observe;

    // Since 0.5.5
    pop(keypath: string): Promise<void>;

    // Since 0.5.5
    push(keypath: string, value: any): Promise<void>;

    // target - Node or String or jQuery (see Valid selectors)
    render(target: any): void; // TODO: void?

    // Default {}
        reset(data?: Object): Promise<void>;
    
    // Since 0.7.1
    resetPartial(name: string, partial: any): Promise<void>;

    // Since 0.5.5
    // TODO: undocumented, mentioned in ractive change log
    // https://github.com/ractivejs/docs.ractivejs.org/issues/188
    resetTemplate(): void; // TODO: void?

    set(keypath: string, value: any): Promise<void>;
    set(map: Object): Promise<void>;

    // Since 0.5.5
    shift(keypath: string): Promise<void>;

    // Since 0.5.5
    splice(keypath: string, index: number, removeCount: number, ...add: any[]): Promise<void>;

    subtract(keypath: string, number?: number): Promise<void>;

    teardown(): Promise<void>;

    toggle(keypath: string): Promise<void>;

    toHTML(): string;

    // Since 0.6.0
    unrender(): void; // TODO: void?

    // Since 0.5.5
    unshift(keypath: string, value: any): Promise<void>;

    update(keypath?: string): Promise<void>;

  /**
    * Update out of sync two-way bindings
    * @param keypath A string
    * @param cascade A boolean with default false
    */
    updateModel(keypath?: string, cascade?: boolean): Promise<void>;

    // Properties
    // Since 0.7.1
    container: IRactive; // TODO: Ractive?
    nodes: any;
    partials: Object;
    // Since 0.7.1
    parent: IRactive; // TODO: Ractive?
    // Since 0.7.1
    root: IRactive; // TODO: Ractive?
    transitions: Object;
}

declare module "base/lib/ractive.min" {
  var RactiveStatic: Static;
  export = RactiveStatic;    
}
