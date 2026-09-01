type JsonSchema = Record<string, unknown>;

const object = (properties: Record<string, JsonSchema>, required: string[] = Object.keys(properties), extra: Record<string, unknown> = {}): JsonSchema => ({
  type: 'object', properties, required, additionalProperties: false, ...extra,
});
const literal = (value: string): JsonSchema => ({ type: 'string', enum: [value] });
const action = (type: string, payload: JsonSchema): JsonSchema => object({ type: literal(type), payload });
const patch: JsonSchema = { type: 'object', additionalProperties: true };

const actionSchemas: JsonSchema[] = [
  action('create_from_template', object({ templateId: { type:'string', minLength:1 } })),
  action('set_metadata', object({ name:{type:'string',minLength:1}, category:{type:'string'} }, [], { minProperties:1 })),
  action('set_theme', object({ preset:{type:'string',minLength:1}, primaryColor:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'}, radius:{type:'string'} }, [], { minProperties:1 })),
  action('add_module', object({ moduleType:{type:'string',minLength:1} })),
  action('remove_module', object({ moduleType:{type:'string',minLength:1} })),
  action('set_module_enabled', object({ moduleType:{type:'string',minLength:1}, enabled:{type:'boolean'} })),
  action('patch_module_config', object({ moduleType:{type:'string',minLength:1}, patch })),
  action('reorder_module', object({ moduleType:{type:'string',minLength:1}, toIndex:{type:'integer',minimum:0} })),
  action('set_tool_enabled', object({ toolType:{type:'string',minLength:1}, enabled:{type:'boolean'} })),
  action('patch_tool_config', object({ toolType:{type:'string',minLength:1}, patch })),
  action('set_guard_enabled', object({ guardType:{type:'string',minLength:1}, enabled:{type:'boolean'} })),
  action('patch_guard_config', object({ guardType:{type:'string',minLength:1}, patch })),
];

export const AI_PLAN_JSON_SCHEMA: JsonSchema = object({
  id: { type:'string', minLength:1 },
  userIntent: { type:'string' },
  summary: { type:'string' },
  explanation: { type:'string' },
  actions: { type:'array', items:{ oneOf:actionSchemas }, maxItems:40 },
  missingInformation: { type:'array', items:{type:'string'}, maxItems:20 },
  suggestedQuestions: { type:'array', items:{type:'string'}, maxItems:20 },
  riskLevel: { type:'string', enum:['low','medium','high'] },
});
