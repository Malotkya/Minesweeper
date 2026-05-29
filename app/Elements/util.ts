export type Content = number|string|boolean|bigint|Element|HTMLSelectElement|null|Array<Content>
export function isContent(value:unknown):value is Content {
    switch(typeof value) {
        case "function":
        case "symbol":
            return false;

        case "object":
            return value === null || value instanceof Element || Array.isArray(value);

        default:
            return true;
    }
}

export function appendContent(element:Element, child:Content):void {
    if(child instanceof Element) {
        element.appendChild(child);
    } else if(Array.isArray(child)){
        for(let c of child) {
            appendContent(element, c);
        }
    } else if(child !== null && child !== undefined) {
        element.append(String(child));
    }
}

function fix(name:string):string {
    return name.replaceAll(/([A-Z])/g, ("-$1")).toLocaleLowerCase();
}

type EventHandler<E extends Event> = (event:E)=>any;
export type Attribute = string|number|boolean|EventHandler<any>|URL|Date|undefined|string[];
function setNormalAttribute(element:HTMLElement, name:string, value:Attribute):void {
    name = fix(name);

    switch(typeof value){
        case "boolean":
            element.toggleAttribute(name, value);
            break;

        case "string":
            element.setAttribute(name, value);
            break;

        case "undefined":
            break;

        case "object":
            if(Array.isArray(value)) {
                element.setAttribute(name, value.join(" "));
                break;
            } else if(value instanceof URL) {
                element.setAttribute(name, value.toString());
                break;
            } else if(value instanceof Date) {
                element.setAttribute(name, value.toDateString());
                break;
            } else {
                element.setAttribute(name, JSON.stringify(value))
            }
            break;

        default:
            element.setAttribute(name, String(value));
    }
}

function setEventAttribute(element:Element, name:string, value:string|EventHandler<any>) {
    switch(typeof value) {
        case "string":
            element.setAttribute(name.toLocaleLowerCase(), value);
            break;

        case "function":
            element.addEventListener(name.replace(/on/i, "").toLocaleLowerCase(), value);
            break;

        default:
            throw new TypeError("Event Attribute must a Function or string!");
    }
}

function setAriaAttribute(element:Element, name:string, value:Attribute) {
    name = fix(name);
    switch(typeof value) {
        case "number":
            if(isNaN(value))
                console.warn("NaN passed as Aria Attribute value!");

            element.setAttribute(name, value.toString());
            break;

        case "boolean":
            element.setAttribute(name, value?"true":"false");
            break;

        case "string":
            element.setAttribute(name, value);
            break;

        case "undefined":
            return;

        case "object":
            if(Array.isArray(value)) {
                element.setAttribute(name, value.join(" "));
                break;
            }

        default:
            console.warn("Unknown value passed as Aria Attribute: ", value);
            element.setAttribute(name, String(value));
    }
}

export type AttributeList = Record<string, Attribute>;
export function setAttributeList(element:HTMLElement, attributes:AttributeList):void {
    for(const name in attributes) {
        const value = attributes[name];

        if(name.includes("aria")) {
            setAriaAttribute(element, name, value);
        }else if(typeof value === "function" || (name.includes("on") && typeof value === "string")) {
            setEventAttribute(element, name, value);
        } else {
            setNormalAttribute(element, name, value);
        }
    }
}

/** Creates HTML Content
 * 
 * Streamlines creating an HTML element, assigning attributes, and adding children.
 * 
 * @param {string} name 
 * @param {Object} attributes 
 * @param {Array<Content>} children 
 * @returns {HTMLElement}
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(name:K, attributes?:AttributeList|Content, ...children:Array<Content>):HTMLElementTagNameMap[K]
export function createElement(name:string, attributes:AttributeList|Content = {}, ...children:Array<Content>):HTMLElement {
    
    if(isContent(attributes)) {
        children.unshift(attributes);
        attributes = {};
    }
    
    const element = document.createElement(name);
    setAttributeList(element, attributes);
    appendContent(element, children);

    return element;
}

export type SVGAttributesMap = Record<string, string|number>;
export function setSvgAttributes(element:SVGElement, attributes:SVGAttributesMap) {
    for(const name in attributes) {
        element.setAttribute(name, String(attributes[name]))
        //element.setAttributeNS("http://www.w3.org/2000/svg", fix(name), String(attributes[name]))
    }
}

export type SVGContent = SVGElement|string|SVGContent[];
export function appendSVGContnet(target:SVGElement, content:SVGContent) {
    if(Array.isArray(content)) {
        for(const child of content) {
            appendSVGContnet(target, child);
        }
    } else if(content instanceof SVGElement) {
        target.appendChild(content);
    } else {
        target.append(String(content))
    }
}

export function svg(attributes?:SVGAttributesMap|SVGElement, ...children:Array<SVGContent>):SVGSVGElement
export function svg<K extends keyof SVGElementTagNameMap>(name:K, attributes?:SVGAttributesMap|SVGContent, ...child:Array<SVGContent>):SVGElementTagNameMap[K]
export function svg(name:SVGAttributesMap|SVGContent|undefined, attributes:SVGAttributesMap|SVGContent = {}, ...children:Array<SVGContent>):SVGElement {
    if(typeof name !== "string") {
        if(attributes instanceof SVGElement || Array.isArray(attributes)) {
            children.unshift(attributes);
        } else {
            throw new TypeError(`Attributes is an illegale type of ${typeof attributes}!`)
        }
        
        if(name instanceof SVGElement || Array.isArray(name)) {
            children.unshift(name);
            attributes = {};
            
        } else {
            attributes = name || {};
        }
        name = "svg";
    } else if(attributes instanceof SVGElement || Array.isArray(attributes) || typeof attributes !== "object") {
        children.unshift(attributes);
        attributes = {};
    }

    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    setSvgAttributes(element, attributes);
    appendSVGContnet(element, children)

    return element;
}

export type Fill = number|[number, number];
function createFill(y:number, fill:Fill, color:string):SVGRectElement[] {
    if(Array.isArray(fill)) {
        const output:SVGRectElement[] = [];
        for(let x=fill[0]; x<=fill[1]; ++x)
            output.push(svg("rect", {width: 1, height: 1, y, x, fill:color}));
        return output;
    }

    return [svg("rect", {width: 1, height: 1, y, x:fill, fill:color})]
}

export type Group = number|Fill[];
function fillGroup(group:Group, fill:Fill, color:string):SVGRectElement[] {
    if(Array.isArray(group)) {
        return group.flatMap((y)=>{
            if(Array.isArray(y)) {
                let output:SVGRectElement[] = [];
                for(let i=y[0]; i<=y[1]; ++i)
                    output = output.concat(createFill(i, fill, color));
                return output;
            }

            return createFill(y, fill, color)
        });
    }

    return createFill(group, fill, color);
}

export type Pattern = [Group, Fill[]][];
export interface PatternOptions {
    bgColor?:string, 
    fillColor?:string,
    viewBox?:{top:number, left:number, bottom:number, right:number}|{width:number, height:number}|string|number
}

export function renderPattern(pattern:Pattern, opts:PatternOptions = {}):SVGSVGElement {
    let {bgColor = "white", fillColor = "black", viewBox} = opts;
    
    let background:SVGRectElement;
    switch (typeof viewBox) {
        case "object":
            if("width" in viewBox || "height" in viewBox) {
                const {width = 0, height = 0} = viewBox as {width:number, height:number};

                background = svg("rect", {width:width+2, height:height+2, x:-1, y:-1});
                viewBox = `0 0 ${height} ${width}`;
            } else {
                const {top = 0, left = 0, bottom = 0, right = 0} = viewBox;

                background = svg("rect", {x:left-1, y:top-1, width:right-left+2, height:bottom-top+2, fill:bgColor});
                viewBox = `${top} ${left} ${bottom} ${right}`;
            }
            break;

        case "undefined":
            viewBox = 100;
        case "bigint":
            viewBox = Number(viewBox);

        case "number":
            background = svg("rect", {x:-1, y:-1, width:viewBox+2, height:viewBox+2, fill:bgColor});
            viewBox = `0 0 ${viewBox} ${viewBox}`;
            
            break;
        
        case "string":
            const [top, left = top, bottom = top, right = left] = viewBox.split(/\s+/).map(Number);
            background = svg("rect", {x:left-1, y:top-1, width:right-left+2, height:bottom-top+2})
            break;

        default:
            throw new TypeError("Invalid typeof viewbox!");

    }

    return svg({viewBox},
        background,
        pattern.flatMap(([group, fill])=>fill.flatMap(fill=>fillGroup(group, fill, fillColor)))
    )
}

export async function apiFetch(name:"load"|"reset"):Promise<Minesweeper.State|Error>
export async function apiFetch<A extends Minesweeper.Action>(name:A["action"], value:A["value"]):Promise<Minesweeper.State|Error>
export async function apiFetch(action:string, value?:any):Promise<Minesweeper.State|Error> {
    const resp = await fetch("/api", {
        body: JSON.stringify({action, value}),
        method: "POST"
    });
    
    let body:any;
    try {   
        body = await resp.json();
        if(typeof body !== "object") {
            console.error("Invalid Json Body!:\n", body);
            return new Error("Invalid Response!");
        }

    } catch (e) {
        console.error(e);
        return new Error("Invalid Response!");
    }
    
    if(!resp.ok) {
        console.error(body);
        return new Error(body.message || resp.statusText);
    }

    console.debug(body);

    return body;
}