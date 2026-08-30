// Monaco recibe este módulo entero con un spread; sólo `theme` se pide aparte.
export const automaticLayout = true;
export const contextmenu = false;
export const renderLineHighlight = 'none';
export const theme = 'pensieve';

// Monaco cambió el textarea por el EditContext de Chrome y pierde ráfagas de
// teclas mientras se engancha: la suite escribe «new line added» y llega «new
// ldded». Un editor de notas no puede comerse letras, así que sigue el textarea.
export const editContext = false;
