import { motion } from "motion/react";
import { useState } from "react";

export function ChronicleButton({ handleContinueWriting, canContinue, isGenerating }: { handleContinueWriting: () => void, canContinue: boolean, isGenerating: boolean }) {
	
	const firstSpanVariants = {
		initial: {
			y: 0,
			opacity: 1,
		},
		hover: {
			y: -20,
			opacity: 0
		}
	}

	const secondSpanVariants = {
		initial: {
			y: 20,
			opacity: 0,
		},
		hover: {
			y: 0,
			opacity: 1
		}
	}

	const [hover, setHover] = useState(false);

	return (
		<div className='flex items-center gap-4 justify-center relative py-16'>
			<motion.button
				onClick={handleContinueWriting}
				disabled={!canContinue}
				className={`${canContinue ? 'bg-white' : 'bg-white/50'} text-black px-4 py-2 w-40 h-14
        whitespace-nowrap font-medium transition-all duration-300 tracking-tight relative flex items-center justify-center`}
				whileHover="hover"
				onHoverStart={() => setHover(true)}
				onHoverEnd={() => setHover(false)}
				initial="initial"
				variants={{
					initial: {},
					hover: {}
				}}
			>
				<motion.span
					initial={{ scaleX: 1.5 }}
					animate={hover ? { scaleX: 2.5 } : { scaleX: 1.5 }}
					transition={{ duration: 0.2, ease: 'linear' }}
					className='absolute h-[1px] w-full top-0 left-0 origin-left bg-gradient-to-r from-white to-transparent'
				/>
				<motion.span
					initial={{ scaleY: 1.5 }}
					animate={hover ? { scaleY: 2.5 } : { scaleY: 1.5 }}
					transition={{ duration: 0.2, ease: 'linear' }}
					className='absolute w-[1px] h-full bottom-0 right-0 origin-bottom bg-gradient-to-t from-white to-transparent'
				/>
				<motion.span
					initial={{ scaleX: 1.5 }}
					animate={hover ? { scaleX: 2.5 } : { scaleX: 1.5 }}
					transition={{ duration: 0.2, ease: 'linear' }}
					className='absolute h-[1px] w-full bottom-0 right-0 origin-right bg-gradient-to-l from-white to-transparent'
				/>
				<motion.span
					initial={{ scaleY: 1.5 }}
					animate={hover ? { scaleY: 2.5 } : { scaleY: 1.5 }}
					transition={{ duration: 0.2, ease: 'linear' }}
					className='absolute w-[1px] h-full bottom-0 left-0 origin-top bg-gradient-to-b from-white to-transparent'
				/>
				<motion.span
					variants={firstSpanVariants}
					className="absolute w-full flex items-center justify-center gap-2"
				>
					{isGenerating && (
						<div className='w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin' />
					)}
					{isGenerating ? 'Generating...' : 'Continue Writing'}
				</motion.span>
				<motion.span
					variants={secondSpanVariants}
					className="absolute w-full flex items-center justify-center gap-2"
				>
					{isGenerating && (
						<div className='w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin' />
					)}
					{isGenerating ? 'Generating...' : 'Continue Writing'}
				</motion.span>
			</motion.button>
		</div>
	);
}