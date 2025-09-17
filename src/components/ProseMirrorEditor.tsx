import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from 'prosemirror-schema-basic';
import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';

interface ProseMirrorEditorProps {
  onEditorCreated: (editorState: EditorState) => void;
  onEditorUpdate: (editorState: EditorState) => void;
  onTextInsert?: (text: string) => void;
  placeholder?: string;
}

export interface ProseMirrorEditorRef {
  insertText: (text: string, streaming?: boolean) => void;
  getCursorPosition: () => { left: number; top: number } | null;
}

export const ProseMirrorEditor = forwardRef<ProseMirrorEditorRef, ProseMirrorEditorProps>(({
  onEditorCreated,
  onEditorUpdate,
  placeholder = 'Start writing ...',
}, ref) => {
  
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  // Update placeholder visibility based on editor content
  const updatePlaceholderVisibility = (editorState: EditorState) => {
    if (!placeholderRef.current) return;
    
    const isEmpty = editorState.doc.textContent.trim() === '';
    placeholderRef.current.style.display = isEmpty ? 'block' : 'none';
  };

  // EXPOSE METHOD TO PARENT COMPONENT
  useImperativeHandle(ref, () => ({
    insertText: async (text: string, streaming = true) => {
      if (!viewRef.current) return;
      
      if (!streaming) {
        // Insert all text at once (original behavior)
        const { state } = viewRef.current;
        const { to } = state.selection;
        const transaction = state.tr.insertText(text, to);
        viewRef.current.dispatch(transaction);
        return;
      }
      
      // Streaming effect
      const { state } = viewRef.current;
      const startPos = state.selection.to;
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const currentState = viewRef.current.state;
        const currentPos = startPos + i;
        const transaction = currentState.tr.insertText(char, currentPos);
        viewRef.current.dispatch(transaction);
        
        // Small delay between characters for streaming effect
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    },

    getCursorPosition: () => {
      if (!viewRef.current || !containerRef.current) return null;
      
      const { state } = viewRef.current;
      const { from } = state.selection;
      
      // Get the DOM coordinates of the cursor position
      const coords = viewRef.current.coordsAtPos(from);
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Return position relative to the container
      return {
        left: coords.left - containerRect.left,
        top: coords.top - containerRect.top
      };
    }
  }), []);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      schema,
      plugins: [
        history(),
        keymap(baseKeymap),
      ],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction: Transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
        updatePlaceholderVisibility(newState);
        onEditorUpdate(newState);
      },
      attributes: {
        class: 'prose-mirror-editor',
      },
    });

    viewRef.current = view;
    
    // Initial placeholder visibility
    updatePlaceholderVisibility(state);
    
    onEditorCreated(state);

    return () => {
      view.destroy();
    };
  }, [onEditorCreated, onEditorUpdate, placeholder]);

  const handleContainerClick = () => {
    if (viewRef.current) {
      viewRef.current.focus();
    }
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleContainerClick}
      className="prose-mirror-container bg-neutral-900 border border-neutral-800 whitespace-pre-wrap h-64 rounded-xl p-4
      w-full shadow-[-4px_5px_120px_70px_rgba(255,_255,_255,_0.10)] text-left cursor-text relative"
    >
      <div 
        ref={placeholderRef}
        className="absolute top-4 left-4 text-gray-400 pointer-events-none select-none"
        style={{ display: 'block' }}
      >
        {placeholder}
      </div>
      <div ref={editorRef} className="h-full w-full relative z-10" />
    </div>
  );
});
