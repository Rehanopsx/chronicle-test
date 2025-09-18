import React, { useState, useCallback } from 'react';
import { EditorState } from 'prosemirror-state';
import { ProseMirrorEditor } from './ProseMirrorEditor';
import { ChronicleButton } from './ChronicleButton';
import { useEditorState } from '../hooks/useEditorState';

export const TextEditorApp: React.FC = () => {

	const [cursorPosition, setCursorPosition] = useState<{ left: number; top: number } | null>(null);
	const {
		canContinue,
		isGenerating,
		hasError,
		isLoading,
		currentText,
		error,
		handleEditorCreated,
		handleEditorUpdate,
		handleContinueWriting,
		editorRef,
	} = useEditorState();

	const handleEditorUpdateWithCursor = useCallback((editorState: EditorState) => {
		handleEditorUpdate(editorState);
		// Update cursor position
		if (editorRef.current) {
			const position = editorRef.current.getCursorPosition();
			setCursorPosition(position);
		}
	}, [handleEditorUpdate, editorRef]);

	return (
		<div className='text-white w-full'>
			<div className='my-12 text-center'>
				<h1 className='text-7xl font-bold mb-2 leading-tighter tracking-tighter'>
					AI Writing Assistant
				</h1>
				<p>
					Start writing and let AI help you continue your thoughts
				</p>
			</div>

			<div className='mb-6 relative w-2/3 mx-auto'>
				<ProseMirrorEditor
					ref={editorRef}
					onEditorCreated={handleEditorCreated}
					onEditorUpdate={handleEditorUpdateWithCursor}
					placeholder="Start writing your story, article, or any text..."
				/>
				{isLoading && cursorPosition && (
					<div 
						className='text-white/50 flex items-center gap-1 pointer-events-none'
						style={{
							position: 'absolute',
							left: cursorPosition.left + 14 + 'px',
							top: cursorPosition.top - 14 + 'px',
						}}
					>
						<div className='flex text-3xl'>
							<span className='animate-pulse'>.</span>
							<span className='animate-pulse' style={{animationDelay: '0.2s'}}>.</span>
							<span className='animate-pulse' style={{animationDelay: '0.4s'}}>.</span>
						</div>
					</div>
				)}
				<div className='text-white/50 absolute m-1 text-xs right-2 bottom-2'>
					{currentText.length} characters
				</div>
			</div>

			<ChronicleButton 
				handleContinueWriting={handleContinueWriting} 
				canContinue={canContinue} 
				isGenerating={isGenerating} 
			/>

			{hasError && (
				<div className='bg-red-100 text-red-800 rounded-md px-4 py-2'>
					<strong>Error:</strong> {error?.toString()}
				</div>
			)}
		</div>
	);
};
