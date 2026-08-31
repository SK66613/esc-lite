import { create } from 'zustand';
export type Route='ai'|'home'|'builder'|'preview'|'settings'|'tool'|'access';
type PreviewSource='draft'|'published'; type Device='phone'|'full';
type EditorStore={route:Route;selectedModuleId?:string;sheet?:'templates'|'modules';previewSource:PreviewSource;device:Device;setRoute:(route:Route)=>void;selectModule:(id?:string)=>void;setSheet:(sheet?:'templates'|'modules')=>void;setPreviewSource:(source:PreviewSource)=>void;setDevice:(device:Device)=>void};
export const useEditorStore=create<EditorStore>(set=>({route:'ai',previewSource:'draft',device:'phone',setRoute:route=>set({route}),selectModule:selectedModuleId=>set({selectedModuleId}),setSheet:sheet=>set({sheet}),setPreviewSource:previewSource=>set({previewSource}),setDevice:device=>set({device})}));
