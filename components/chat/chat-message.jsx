import { BotMessageSquare, Loader, User } from 'lucide-react'
import { ChatRole, downloadImg, parseImage } from '@/utils'
import { memo, useMemo } from 'react'

import { CopyContent } from '@/components/common/CopyContent'
import { ChevronRight } from 'lucide-react'
import { Download } from 'lucide-react'
import { IconWrap } from '../common/IconWrap'
import { ImagePreview } from '@/components/common/ImagePreview'
import { MarkdownPreview } from '@/components/common/MarkdownPreview'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

function parseReasoningContent(content) {
	const text = String(content || '')
	if (!text) {
		return { reasoning: '', content: '' }
	}

	const patterns = [
		/^\s*>\s*\*\*思考过程\*\*\s*\n?/,
		/^\s*\*\*思考过程\*\*\s*\n?/,
		/^\s*>\s*思考过程[:：]?\s*\n?/,
		/^\s*思考过程[:：]?\s*\n?/
	]

	const marker = patterns.find((pattern) => pattern.test(text))
	if (!marker) {
		return { reasoning: '', content: text }
	}

	const body = text.replace(marker, '')
	const separators = [/\n{3,}/, /\n\s*\n(?=#{1,6}\s|\*\*|`{3,}|-{3,}|\d+\.\s|[A-Za-z\u4e00-\u9fa5])/]

	for (const separator of separators) {
		const match = separator.exec(body)
		if (!match) continue

		const splitIndex = match.index
		const reasoning = body.slice(0, splitIndex).trim()
		const answer = body.slice(splitIndex + match[0].length).trim()
		if (!answer) continue

		return {
			reasoning,
			content: answer
		}
	}

	return { reasoning: '', content: text }
}

const ChatMessage = memo(({ message, onRegenerate }) => {
	const { role, pending, content, timestamp, isImage, nickName, model } = message

	const isUser = role === ChatRole.User
	const roleName = isUser ? 'self-end flex-row-reverse' : 'self-start'
	const timeStr = timestamp ? new Date(timestamp).toLocaleString() : ''

	const onDownload = () => {
		downloadImg(content)
	}

	const [finalContent, imgData] = useMemo(() => {
		if (isImage) {
			return [content, '']
		} else {
			return parseImage(content)
		}
	}, [isImage, content])

	const { reasoning, content: answerContent } = useMemo(() => {
		return parseReasoningContent(finalContent)
	}, [finalContent])

	return (
		<div className='flex flex-col gap-2 mb-5'>
			<div className={cn('flex items-center gap-2 group', roleName)}>
				<div className='text-primary flex items-center gap-1'>
					{!isUser && (
						<>
							<BotMessageSquare />
							<span className='text-muted-foreground text-sm'>{model}</span>
						</>
					)}
					{isUser && (
						<>
							<span className='text-muted-foreground text-sm'>{nickName}</span>
							<User />
						</>
					)}
				</div>
				<div className='hidden group-hover:block text-muted-foreground text-sm'>{timeStr}</div>
			</div>
			<div className={cn('max-w-[90%] md:max-w-[70%] relative group', roleName)}>
				<div className='p-4 bg-accent text-foreground rounded-lg mb-2'>
					{isImage && <ImagePreview src={finalContent} />}
					{imgData && <ImagePreview src={imgData} />}
					{!isImage && (
						<div className='text-wrap text-xs md:text-sm break-words whitespace-pre-wrap'>
							{pending && <Loader className='animate-spin' />}
							{!!reasoning && (
								<details className='mb-3 rounded-md border border-border/70 bg-background/60'>
									<summary className='flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs text-muted-foreground select-none'>
										<ChevronRight className='h-4 w-4 shrink-0 transition-transform details-arrow' />
										<span>思考过程</span>
									</summary>
									<div className='border-t border-border/60 px-3 py-2 text-muted-foreground'>
										<MarkdownPreview content={reasoning} />
									</div>
								</details>
							)}
							<MarkdownPreview content={answerContent} />
						</div>
					)}
				</div>
				<div className={cn('flex items-center gap-2', isUser && 'justify-end')}>
					{isImage && !pending && <IconWrap Icon={Download} title='下载' onClick={onDownload} />}
					{!isImage && !pending && (
						<div title='复制内容'>
							<CopyContent content={finalContent} className='block cursor-pointer' />
						</div>
					)}
					{!isUser && !pending && (
						<IconWrap Icon={RefreshCw} title='重新生成' onClick={onRegenerate} />
					)}
				</div>
			</div>
		</div>
	)
})

ChatMessage.displayName = 'ChatMessage'
export { ChatMessage }
