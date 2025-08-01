import path from 'path';
import fs from 'fs/promises';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { existsSync } from 'fs';
import os from 'os';

export async function getWorkspaces() {
	const defaultPath = path.join(os.homedir(), 'Library/Application Support/Trae/User/workspaceStorage');
	const workspacePath = process.env.WORKSPACE_PATH || defaultPath;
	const workspaces = [];
	
	console.log(`Scanning workspace path: ${workspacePath}`);
	const entries = await fs.readdir(workspacePath, { withFileTypes: true });
	console.log(`Found ${entries.length} entries in workspace directory`);
	
	let processedCount = 0;
	for (const entry of entries) {
		if (entry.isDirectory()) {
			const dbPath = path.join(workspacePath, entry.name, 'state.vscdb');
			const workspaceJsonPath = path.join(workspacePath, entry.name, 'workspace.json');
			
			// Skip if state.vscdb doesn't exist
			if (!existsSync(dbPath)) {
				console.log(`Skipping ${entry.name}: no state.vscdb found`);
				continue;
			}
			
			try {
				const stats = await fs.stat(dbPath);
				const db = await open({
					filename: dbPath,
					driver: sqlite3.Database
				});
				
				// Try multiple possible chat data keys - updated with correct key
				const chatKeys = [
					'memento/icube-ai-agent-storage',  // Main chat storage location
					'chat.ChatSessionStore.index',
					'ChatStore',
					'memento/icube-ai-chat-storage-7467774676505887760',
					'memento/icube-ai-ng-chat-storage-7467774676505887760'
				];
				
				let result = null;
				let usedKey = '';
				
				// First try the known keys
				for (const key of chatKeys) {
					result = await db.get(`SELECT value FROM ItemTable WHERE [key] = ?`, key);
					if (result) {
						usedKey = key;
						break;
					}
				}
				
				// If no known keys found, search for any chat-related keys
				if (!result) {
					const chatRelatedKeys = await db.all(`
						SELECT [key], value FROM ItemTable 
						WHERE [key] LIKE '%chat%' 
						   OR [key] LIKE '%ai%' 
						   OR [key] LIKE '%conversation%' 
						   OR [key] LIKE '%session%'
						   OR [key] LIKE '%memento%'
					`);
					
					// Try each potential key and see if it contains chat data
					for (const keyRow of chatRelatedKeys) {
						try {
							const testData = JSON.parse(keyRow.value);
							// Check if this looks like chat data
							if (testData && (
								testData.sessions || 
								testData.conversations || 
								testData.entries || 
								testData.list || 
								Array.isArray(testData)
							)) {
								result = keyRow;
								usedKey = keyRow.key;
								if (processedCount < 3) {
									console.log(`Found potential chat data in ${entry.name} using key: ${usedKey}`);
								}
								break;
							}
						} catch (e) {
							// Skip invalid JSON
						}
					}
				}
				
				// If no chat data found, let's see what keys actually exist
				if (!result && processedCount < 5) {
					const allKeys = await db.all(`SELECT [key] FROM ItemTable WHERE [key] LIKE '%chat%'`);
					if (allKeys.length > 0) {
						console.log(`Chat-related keys in ${entry.name}:`, allKeys.map(k => k.key));
					} else {
						// Check for any keys that might be related to AI chat
						const aiKeys = await db.all(`SELECT [key] FROM ItemTable WHERE [key] LIKE '%ai%' OR [key] LIKE '%conversation%' OR [key] LIKE '%message%'`);
						if (aiKeys.length > 0) {
							console.log(`AI/conversation-related keys in ${entry.name}:`, aiKeys.map(k => k.key));
						}
					}
				}
				
				// Parse the chat data and count tabs
				let chatCount = 0;
				if (result?.value) {
					try {
						const chatData = JSON.parse(result.value);
						
						// Debug: show the structure of the first few workspaces
						if (processedCount < 3) {
							console.log(`Data structure for ${entry.name} using key ${usedKey}:`, Object.keys(chatData));
							if (chatData.sessions) {
								console.log(`Sessions keys:`, Object.keys(chatData.sessions));
							}
							if (chatData.conversations) {
								console.log(`Conversations keys:`, Object.keys(chatData.conversations));
							}
							if (chatData.entries) {
								console.log(`Entries keys:`, Object.keys(chatData.entries));
							}
						}
						
						if (usedKey === 'memento/icube-ai-agent-storage') {
							// Handle the main agent storage format
							if (chatData.list && Array.isArray(chatData.list)) {
								chatCount = chatData.list.length;
							}
						} else if (usedKey === 'ChatStore') {
							// Handle ChatStore format
							if (chatData.sessions) {
								chatCount = Object.keys(chatData.sessions).length;
							} else if (Array.isArray(chatData)) {
								chatCount = chatData.length;
							} else if (chatData.entries) {
								chatCount = Object.keys(chatData.entries).length;
							} else if (chatData.list && Array.isArray(chatData.list)) {
								chatCount = chatData.list.length;
							}
						} else if (usedKey.includes('memento/icube-ai')) {
							// Handle other memento formats
							if (chatData.list && Array.isArray(chatData.list)) {
								chatCount = chatData.list.length;
							} else if (chatData.sessions) {
								chatCount = Object.keys(chatData.sessions).length;
							} else if (chatData.conversations) {
								chatCount = Object.keys(chatData.conversations).length;
							} else if (Array.isArray(chatData)) {
								chatCount = chatData.length;
							}
						} else {
							// Original format (chat.ChatSessionStore.index)
							if (chatData.entries) {
								if (Array.isArray(chatData.entries)) {
									chatCount = chatData.entries.length;
								} else {
									chatCount = Object.keys(chatData.entries).length;
								}
							}
						}
						
						if (chatCount > 0 && processedCount < 3) {
							console.log(`Workspace ${entry.name} has ${chatCount} chats using key: ${usedKey}`);
						}
					} catch (error) {
						console.error('Error parsing chat data:', error);
					}
				} else {
					if (processedCount < 5) {
						console.log(`No chat data found for workspace ${entry.name}`);
					}
				}
				
				// Try to read workspace.json
				let folder = undefined;
				try {
					const workspaceData = JSON.parse(await fs.readFile(workspaceJsonPath, 'utf-8'));
					folder = workspaceData.folder;
				} catch (error) {
					console.log(`No workspace.json found for ${entry.name}`);
				}
				
				workspaces.push({
					id: entry.name,
					path: dbPath,
					folder: folder,
					lastModified: stats.mtime.toISOString(),
					chatCount: chatCount
				});
				
				await db.close();
				processedCount++;
			} catch (error) {
				console.error(`Error processing workspace ${entry.name}:`, error);
			}
		}
	}
	
	console.log(`Found ${workspaces.length} valid workspaces with chat data`);
	return workspaces;
}

// Helper function to detect and clean binary/corrupted content
function cleanContent(content: any): string {
	if (!content) return '';
	
	let str = '';
	
	// Handle different content types
	if (typeof content === 'string') {
		str = content;
	} else if (typeof content === 'object') {
		// Try to extract meaningful content from JSON objects
		if (content.data && content.data.summary) {
			// Handle response objects with data.summary
			str = content.data.summary;
		} else if (content.summary) {
			// Handle objects with direct summary
			str = content.summary;
		} else if (content.content) {
			// Handle objects with content field
			str = content.content;
		} else if (content.text) {
			// Handle objects with text field
			str = content.text;
		} else {
			// Fallback to JSON string
			str = JSON.stringify(content, null, 2);
		}
	} else {
		str = String(content);
	}
	
	// Check if content contains binary data (null bytes, excessive control characters)
	const nullBytes = (str.match(/\u0000/g) || []).length;
	const controlChars = (str.match(/[\u0000-\u001F\u007F-\u009F]/g) || []).length;
	const totalLength = str.length;
	
	// If more than 20% of content is control characters, treat as binary
	if (totalLength > 0 && (controlChars / totalLength) > 0.2) {
		return '*[Binary or corrupted content detected - content filtered]*';
	}
	
	// Clean up common problematic characters
	str = str
		.replace(/\u0000/g, '') // Remove null bytes
		.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // Remove other control chars except \t, \n, \r
		.replace(/\uFFFD/g, '') // Remove replacement characters
		.trim();
	
	// If after cleaning the string is too short or empty, indicate filtered content
	if (str.length < 3 && totalLength > 10) {
		return '*[Content filtered due to encoding issues]*';
	}
	
	// Format JSON content nicely if it looks like JSON
	if (str.startsWith('{') && str.endsWith('}')) {
		try {
			const parsed = JSON.parse(str);
			// If it's a response object, extract the summary
			if (parsed.data && parsed.data.summary) {
				return parsed.data.summary;
			} else if (parsed.summary) {
				return parsed.summary;
			}
			// Otherwise return formatted JSON
			return '```json\n' + JSON.stringify(parsed, null, 2) + '\n```';
		} catch (e) {
			// If JSON parsing fails, return as is
			return str;
		}
	}
	
	return str;
}

function formatToolUsage(item: any, index: number): string {
	let result = '';
	
	if (index > 0) result += `\n`;
	result += `**🔄 步骤 ${index + 1}**\n\n`;
	
	// Add thought process
	if (item.thought) {
		const cleanedThought = cleanContent(item.thought);
		if (cleanedThought && !cleanedThought.startsWith('*[')) {
			result += `💭 **思考过程:**\n\n${cleanedThought}\n\n`;
		}
	}
	
	// Add tool usage with special formatting for file operations
	if (item.toolName) {
		const isFileOperation = ['update_file', 'write_to_file', 'edit_file_fast_apply', 'view_files'].includes(item.toolName);
		
		if (isFileOperation && item.params) {
			// Special formatting for file operations
			const fileName = item.params.file_path ? item.params.file_path.split('/').pop() : 'unknown file';
			const operation = getOperationName(item.toolName);
			
			result += `<details><summary>${operation}: ${fileName}</summary>\n\n`;
			
			// Add parameters if available
			if (item.params && typeof item.params === 'object') {
				result += `**参数配置:**\n\n`;
				Object.entries(item.params).forEach(([key, value]) => {
					if (key !== 'file_path') { // Skip file_path as it's already in summary
						const cleanedValue = cleanContent(value);
						if (cleanedValue.length > 100) {
							result += `- **${key}:** \n\`\`\`\n${cleanedValue}\n\`\`\`\n`;
						} else {
							result += `- **${key}:** ${cleanedValue}\n`;
						}
					}
				});
				result += `\n`;
			}
			
			// Add tool result with diff format if it looks like code changes
			if (item.result) {
				const cleanedResult = cleanContent(item.result);
				if (cleanedResult && !cleanedResult.startsWith('*[')) {
					result += `**执行结果:**\n\n`;
					if (cleanedResult.includes('@@') || cleanedResult.includes('+++') || cleanedResult.includes('---')) {
						// Looks like a diff, format accordingly
						result += `**Chunk 1**\n`;
						result += `Lines modified\n\n`;
						result += `\`\`\`diff\n${cleanedResult}\n\`\`\`\n\n`;
					} else {
						result += `${cleanedResult}\n\n`;
					}
				}
			}
			
			result += `</details>\n\n`;
		} else {
			// Regular tool formatting
			result += `🔧 **使用工具:** \`${item.toolName}\`\n\n`;
			if (item.params && typeof item.params === 'object') {
				result += `**参数配置:**\n\n`;
				Object.entries(item.params).forEach(([key, value]) => {
					const cleanedValue = cleanContent(value);
					result += `- **${key}:** ${cleanedValue}\n`;
				});
				result += `\n`;
			}
			
			// Add tool result
			if (item.result) {
				const cleanedResult = cleanContent(item.result);
				if (cleanedResult && !cleanedResult.startsWith('*[')) {
					result += `📋 **执行结果:**\n\n`;
					if (cleanedResult.length > 500) {
						result += `<details>\n<summary>点击展开详细结果</summary>\n\n${cleanedResult}\n\n</details>\n\n`;
					} else {
						result += `${cleanedResult}\n\n`;
					}
				}
			}
		}
	}
	
	// Special handling for finish tool (final summary)
	if (item.toolName === 'finish' && item.params && item.params.summary) {
		const cleanedSummary = cleanContent(item.params.summary);
		if (cleanedSummary && !cleanedSummary.startsWith('*[')) {
			result += `✅ **最终回复:**\n\n${cleanedSummary}\n\n`;
		}
	}
	
	return result;
}

function getOperationName(toolName: string): string {
	const operationMap: { [key: string]: string } = {
		'update_file': 'Edit file',
		'write_to_file': 'Create file',
		'edit_file_fast_apply': 'Edit file',
		'view_files': 'View file',
		'delete_file': 'Delete file',
		'rename_file': 'Rename file'
	};
	return operationMap[toolName] || 'File operation';
}

export function formatChatContent(sessionData: any, workspace?: any): string {
	// Generate workspace name for title
	let workspaceName = 'Unknown Workspace';
	if (workspace) {
		if (workspace.folder) {
			// Extract folder name from path
			workspaceName = workspace.folder.split('/').pop() || workspace.folder;
		} else {
			workspaceName = workspace.id || 'Unknown Workspace';
		}
	}
	
	// Generate a meaningful title using workspace name
	let chatTitle = sessionData.title || sessionData.name;
	if (!chatTitle) {
		chatTitle = sessionData.sessionId ? `Chat ${sessionData.sessionId.slice(0, 8)}` : 'Untitled Chat';
	}
	
	const title = `# ${workspaceName} - ${chatTitle}`;
	
	// Get creation and update timestamps
	const createdAt = sessionData.createdAt ? new Date(sessionData.createdAt).toLocaleString() : 'Unknown';
	const updatedAt = sessionData.updatedAt ? new Date(sessionData.updatedAt).toLocaleString() : 'Unknown';
	
	let content = `${title}\n\n`;
	
	// Add metadata section
	content += `## 📋 会话信息\n\n`;
	content += `| 属性 | 值 |\n`;
	content += `|------|----|\n`;
	content += `| **工作区** | ${workspaceName} |\n`;
	content += `| **会话ID** | ${sessionData.sessionId || sessionData.id || 'Unknown'} |\n`;
	content += `| **类型** | ${sessionData.type || 'Unknown'} |\n`;
	content += `| **创建时间** | ${createdAt} |\n`;
	content += `| **更新时间** | ${updatedAt} |\n\n`;
	content += `---\n\n`;

	const messages = sessionData.messages || [];
	
	if (!messages || messages.length === 0) {
		content += `## 💬 对话内容\n\n`;
		content += `> ⚠️ 此会话中未找到任何消息记录。\n\n`;
		return content;
	}

	// Group messages by turnId to pair user questions with AI responses
	const messagesByTurn: { [turnId: string]: any[] } = {};
	
	messages.forEach((message: any) => {
		const turnId = message.turnId || 'unknown';
		if (!messagesByTurn[turnId]) {
			messagesByTurn[turnId] = [];
		}
		messagesByTurn[turnId].push(message);
	});

	// Sort turns by turnIndex or timestamp
	const sortedTurns = Object.keys(messagesByTurn).sort((a, b) => {
		const turnA = messagesByTurn[a][0];
		const turnB = messagesByTurn[b][0];
		
		// First try to sort by turnIndex
		if (turnA.turnIndex !== undefined && turnB.turnIndex !== undefined) {
			return turnA.turnIndex - turnB.turnIndex;
		}
		
		// Fallback to timestamp
		const timestampA = turnA.timestamp || 0;
		const timestampB = turnB.timestamp || 0;
		return timestampA - timestampB;
	});

	// Add conversation overview
	content += `## 📊 对话概览\n\n`;
	content += `- **总轮次:** ${sortedTurns.length} 轮对话\n`;
	content += `- **消息总数:** ${messages.length} 条消息\n`;
	content += `- **参与者:** 用户 & AI 助手\n\n`;
	content += `---\n\n`;
	
	// Add table of contents
	content += `## 📑 目录\n\n`;
	sortedTurns.forEach((turnId, index) => {
		const turnMessages = messagesByTurn[turnId];
		const userMessage = turnMessages.find(m => m.role === 'user');
		let userContent = '无标题';
		
		if (userMessage) {
			// Extract content from user message
			const possibleContentFields = ['content', 'text', 'message', 'body', 'prompt'];
			for (const field of possibleContentFields) {
				if (userMessage[field]) {
					const cleanedContent = cleanContent(userMessage[field]);
					if (cleanedContent && !cleanedContent.startsWith('*[')) {
						userContent = cleanedContent;
						break;
					}
				}
			}
		}
		
		const shortTitle = userContent.length > 50 ? userContent.substring(0, 50) + '...' : userContent;
		content += `- [第${index + 1}轮对话](#第${index + 1}轮对话): ${shortTitle}\n`;
	});
	content += `\n---\n\n`;
	
	content += `## 💬 对话内容\n\n`;

	sortedTurns.forEach((turnId, index) => {
		const turnMessages = messagesByTurn[turnId];
		
		// Sort messages within turn (user first, then assistant)
		turnMessages.sort((a, b) => {
			if (a.role === 'user' && b.role === 'assistant') return -1;
			if (a.role === 'assistant' && b.role === 'user') return 1;
			return (a.timestamp || 0) - (b.timestamp || 0);
		});

		content += `### 第${index + 1}轮对话\n\n`;

		turnMessages.forEach((message: any) => {
			// Extract content based on message role
			let messageContent = '';
			
			if (message.role === 'user') {
				// For user messages, try standard content fields
				const possibleContentFields = ['content', 'text', 'message', 'body', 'prompt'];
				for (const field of possibleContentFields) {
					if (message[field]) {
						const cleanedContent = cleanContent(message[field]);
						if (cleanedContent && !cleanedContent.startsWith('*[')) {
							messageContent = cleanedContent;
							break;
						}
					}
				}
				
				content += `#### 👤 用户提问\n\n`;
				
				if (messageContent) {
					content += `${messageContent}\n\n`;
				} else {
					content += `> ⚠️ *用户消息内容为空或无法解析*\n\n`;
				}
				
				// Add parsed query if available
				if (message.parsedQuery && Array.isArray(message.parsedQuery) && message.parsedQuery.length > 0) {
					content += `**解析查询:** ${message.parsedQuery.join(', ')}\n\n`;
				}
			} else if (message.role === 'assistant') {
				// For AI messages, extract from agentTaskContent.guideline.planItems
				if (message.agentTaskContent && 
					message.agentTaskContent.guideline && 
					Array.isArray(message.agentTaskContent.guideline.planItems)) {
					
					const planItems = message.agentTaskContent.guideline.planItems;
					let aiResponse = '';
					
					planItems.forEach((item: any, index: number) => {
						aiResponse += formatToolUsage(item, index);
						
						if (index < planItems.length - 1) {
							aiResponse += `---\n`;
						}
					});
					
					messageContent = aiResponse.trim();
				}
				
				// Fallback to standard content fields if agentTaskContent not found
				if (!messageContent) {
					const possibleContentFields = ['content', 'text', 'message', 'body', 'response'];
					for (const field of possibleContentFields) {
						if (message[field]) {
							const cleanedContent = cleanContent(message[field]);
							if (cleanedContent && !cleanedContent.startsWith('*[')) {
								messageContent = cleanedContent;
								break;
							}
						}
					}
				}
				
				content += `#### 🤖 ${message.agentName || 'AI'} 回复\n\n`;
				
				if (messageContent) {
					content += `${messageContent}\n\n`;
				} else {
					content += `> ⚠️ *AI 回复内容无法解析 - 检查 agentTaskContent 结构*\n\n`;
					// Debug info for missing content
					if (message.agentTaskContent) {
						content += `> *发现 agentTaskContent，但无 planItems 或结构无效*\n\n`;
					} else {
						content += `> *消息中未找到 agentTaskContent*\n\n`;
					}
				}
			}
		});

		content += `---\n\n`;
	});

	// Add document footer
	content += `## 📝 文档信息\n\n`;
	content += `- **生成时间:** ${new Date().toLocaleString()}\n`;
	content += `- **生成工具:** TraeChats Exporter\n`;
	content += `- **文档版本:** 1.0\n`;
	content += `- **格式:** Markdown\n\n`;
	content += `---\n\n`;
	content += `> 📌 **说明:** 此文档由 TraeChats Exporter 自动生成，包含完整的 AI 对话记录。\n`;
	content += `> 如有问题或建议，请访问项目仓库。\n\n`;

	return content;
}

export function safeParseTimestamp(timestamp: number | undefined): string {
	try {
		if (!timestamp) {
			return new Date().toISOString();
		}
		return new Date(timestamp).toISOString();
	} catch (error) {
		console.error('Error parsing timestamp:', error, 'Raw value:', timestamp);
		return new Date().toISOString();
	}
}