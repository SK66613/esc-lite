import { moduleRegistry } from '../../modules/registry';
import { toolRegistry } from '../../tools/registry';
import { guardRegistry } from '../../guards/registry';
import { templateRegistry } from '../../templates/registry';

type JSONValue=null|boolean|number|string|JSONValue[]|{[key:string]:JSONValue};
export interface CapabilityManifest {
 modules:Array<{type:string;title:string;description:string;version:number;defaultConfig:JSONValue;ai?:{purpose:string;examples?:string[];keywords?:string[];configOptions?:Record<string,{values:readonly (string|number|boolean)[];description?:string}>;presentationVariants?:readonly {id:string;title:string;description:string;purpose?:string;keywords?:readonly string[];bestFor?:readonly string[];supports:readonly string[]}[]}}>;
 tools:Array<{type:string;title:string;description:string;defaultConfig:JSONValue}>;
 guards:Array<{type:string;title:string;description:string;defaultConfig:JSONValue}>;
 templates:Array<{id:string;title:string;description:string}>;
}
const json=<T>(value:T):JSONValue=>JSON.parse(JSON.stringify(value)) as JSONValue;
export function buildCapabilityManifest():CapabilityManifest{return {
 modules:Object.values(moduleRegistry).map(({type,title,description,version,createDefaultConfig,ai})=>({type,title,description,version,defaultConfig:json(createDefaultConfig()),...(ai?{ai}: {})})),
 tools:Object.values(toolRegistry).map(({type,title,description,createDefaultConfig})=>({type,title,description,defaultConfig:json(createDefaultConfig())})),
 guards:Object.values(guardRegistry).map(({type,title,description,createDefaultConfig})=>({type,title,description,defaultConfig:json(createDefaultConfig())})),
 templates:Object.values(templateRegistry).map(({id,title,description})=>({id,title,description})),
};}
