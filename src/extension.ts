// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { getWorkspaces } from './utils';
import { formatChatContent, safeParseTimestamp } from './utils';

// 当你的扩展被激活时会调用此方法
// 扩展在第一次执行命令时被激活
export function activate(context: vscode.ExtensionContext) {
	console.log('Trae Chat Exporter extension is now active!');
	
	// 该命令已在 package.json 文件中定义
	// 现在使用 registerCommand 来实现该命令
	// commandId 参数必须与 package.json 中的 command 字段匹配
	const disposable = vscode.commands.registerCommand('traechat-downloader.downloadChatHistory', async () => {
		console.log('Command traechat-downloader.downloadChatHistory executed!');
		vscode.window.showInformationMessage('Starting to load workspaces...');
		try {
			const workspaces = await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Loading workspaces...",
				cancellable: false,
			}, async (progress) => {
				// Get and filter workspaces
				let workspaces = await getWorkspaces();
				const filteredWorkspaces = workspaces.filter(ws => ws.chatCount > 0);
				console.log(`Filtered to ${filteredWorkspaces.length} workspaces with chat data`);
				return filteredWorkspaces;
			});
	
			if (!workspaces || workspaces.length === 0) {
				vscode.window.showInformationMessage('No workspaces found with chat history.');
				return;
			}
	
			// Sort and display workspaces
			workspaces.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
			const workspaceItems = workspaces.map(ws => ({
				label: ws.folder ? path.basename(ws.folder) : ws.id,
				description: `${ws.chatCount} chats - Last modified: ${new Date(ws.lastModified).toLocaleDateString()}`,
				workspace: ws
			}));
	
			const selectedWorkspace = await vscode.window.showQuickPick(workspaceItems, {
				placeHolder: 'Select a workspace to view chats'
			});
	
			if (selectedWorkspace) {
				await showChatList(selectedWorkspace.workspace);
			}
		} catch (error) {
			vscode.window.showErrorMessage('Failed to load workspaces: ' + error);
		}
	});
	
	context.subscriptions.push(disposable);
	
	async function showChatList(workspace: any) {
		try {
			const chatResult = await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Loading chats for ${workspace.folder ? path.basename(workspace.folder) : workspace.id}...`,
				cancellable: false
			}, async () => {
				const db = await open({
					filename: workspace.path,
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
								break;
							}
						} catch (e) {
							// Skip invalid JSON
						}
					}
				}
	
				await db.close();
				return { result, usedKey };
			});
	
			if (!chatResult.result) {
				vscode.window.showInformationMessage('No chat data found for this workspace.');
				return;
			}

			const chatData = JSON.parse(chatResult.result.value);
			const usedKey = chatResult.usedKey;
			
			// Handle different data structures based on the key used
			let entries: any = {};
			if (usedKey === 'memento/icube-ai-agent-storage') {
				// Handle the main agent storage format
				if (chatData.list && Array.isArray(chatData.list)) {
					// Convert array to object format for consistent processing
					entries = {};
					chatData.list.forEach((item: any, index: number) => {
						entries[item.sessionId || item.id || index] = item;
					});
				}
			} else if (usedKey === 'ChatStore') {
				entries = chatData.sessions || chatData.entries || {};
			} else if (usedKey.includes('memento/icube-ai')) {
				if (chatData.list && Array.isArray(chatData.list)) {
					// Convert array to object format for consistent processing
					entries = {};
					chatData.list.forEach((item: any, index: number) => {
						entries[item.id || index] = item;
					});
				} else {
					entries = chatData.sessions || chatData.conversations || chatData.entries || {};
				}
			} else {
				// Original format
				entries = chatData.entries || {};
			}
			
			if (Object.keys(entries).length === 0) {
				vscode.window.showInformationMessage('No chat sessions found for this workspace.');
				return;
			}
			
			// Convert entries to array and sort by timestamp
			const chatArray = Object.entries(entries).map(([id, sessionData]: [string, any]) => {
				// Generate a meaningful title
				let title = sessionData.title || sessionData.name;
				if (!title) {
					title = sessionData.sessionId ? `Chat ${sessionData.sessionId.slice(0, 8)}` : `Chat ${id.slice(0, 8)}`;
				}

				// Count messages
				const messages = sessionData.messages || [];
				const messageCount = messages.length;
				
				// Get timestamps
				const createdAt = sessionData.createdAt || sessionData.timestamp || 0;
				const updatedAt = sessionData.updatedAt || createdAt;
				
				// Generate preview from first user message
				let preview = 'No messages';
				if (messages.length > 0) {
					const firstUserMessage = messages.find((msg: any) => msg.role === 'user');
					if (firstUserMessage && firstUserMessage.content) {
						preview = firstUserMessage.content.slice(0, 100) + (firstUserMessage.content.length > 100 ? '...' : '');
					}
				}

				// Generate description
				const lastUpdated = updatedAt ? new Date(updatedAt).toLocaleDateString() : 'Unknown';
				const description = `${messageCount} messages • Updated: ${lastUpdated} • ${preview}`;

				return {
					id: sessionData.sessionId || id,
					title,
					description,
					timestamp: updatedAt,
					sessionData
				};
			}).sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

			const chatItems = chatArray.map(item => ({
				label: item.title,
				description: item.description,
				sessionData: item.sessionData  // Pass the original sessionData
			}));
	
			const selectedChat = await vscode.window.showQuickPick(chatItems, {
				placeHolder: 'Select a chat to view',
				matchOnDescription: true
			});
	
			if (selectedChat) {
				await showChatDetails(selectedChat.sessionData, workspace);
			}
		} catch (error) {
			vscode.window.showErrorMessage('Failed to load chats: ' + error);
		}
	}
}

async function showChatDetails(sessionData: any, workspace: any) {
	try {
		const document = await vscode.workspace.openTextDocument({
			content: formatChatContent(sessionData, workspace),
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
	} catch (error) {
		vscode.window.showErrorMessage('Failed to show chat details: ' + error);
	}
}



// This method is called when your extension is deactivated
export function deactivate() { }
