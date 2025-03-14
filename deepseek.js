import plugin from '../../lib/plugins/plugin.js';
import fs from 'fs';
import lodash from 'lodash';
import fetch from "node-fetch";
import cfg from '../../lib/config/config.js';
import { segment } from 'oicq';

const dirpath = "data/deepseek";
var filename = `tempMsg.json`;
if (!fs.existsSync(dirpath)) {//如果文件夹不存在
    fs.mkdirSync(dirpath);//创建文件夹
}
//如果文件不存在，创建文件
if (!fs.existsSync(dirpath + "/" + filename)) {
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({
    }));
}

// 每次重载重置status
var initJson = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
// 遍历 initJson 中的所有项目
for (const id in initJson) {
    if (initJson[id].hasOwnProperty("status")) { // 确保 status 属性存在
        initJson[id].status = 0; // 将 status 设置为 0
    }
}
fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(initJson, null, "\t"));//写入文件

//const base_url = 'https://api.deepseek.com/chat/completions';   //这里填你的endpoint
//const apikey = "sk-1145141919810Tadokoro";   //这里填你的apikey
const base_url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';   //aliyun endpoint
const apikey = "sk-1145141919810Tadokoro";   //这里填你的apikey
let id;
let chatLimit = 3; //允许同时对话的数量
var tempMsg = JSON.parse(`[
    {
      "content": "You are a helpful assistant",
      "role": "system"
    }
    ]`);
//const openAIAuth = await getOpenAIAuth({
// email: process.env.OPENAI_EMAIL,
// password: process.env.OPENAI_PASSWORD
//})
//const api = new ChatGPTAPI({ ...openAIAuth, markdown: false })

//const conversation = api.getConversation()
export class example extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'openai',
            /** 功能描述 */
            dsc: 'openai',
            /** https://oicqjs.github.io/oicq/#events */
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 14000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat)(当前)?设置$", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'config'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat)(对话)?重置(对话)?$", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'reset'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat)新建?(对话)?$", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'newChat'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat)(切换|更改)对话.*$", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'changeChat'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat)删除(对话)?.*$", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'deleteChat'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat)(对话)?列表$", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'listChat'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat)(对话)?帮助$", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'help'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat)(对话)?历史(对话)?.*$", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'history'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat)((修|更)改|切换)(系统)?提示(词)?.*", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'configPrompt'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat)((修|更)改|切换)(对话)?模型.*", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'configModel'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat)((修|更)改|切换)进阶设置.*", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'configOther'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(bot|chat).*", //匹配消息正则,命令正则
                    /** 执行方法 */
                    fnc: 'chat'
                }
            ]
        })
    } 
    /**
     * 调用chatgpt接口
     * @param e oicq传递的事件参数e
     */
     
    async config(e) {
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            tempMsg = JSON.parse(`[
            {
              "content": "You are a helpful assistant",
              "role": "system"
            }
        ]`);
            json[id] = { 'messages': [tempMsg], 'status': 0, 'systemPrompt': 'You are a helpful assistant.', 'model': 'deepseek-chat', 'otherConfig': [4096, 0.7, 1.0, 0.0, 0.0], nowChat: 0 };
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        }
        delete json[id].messages;
        e.reply(JSON.stringify(json[id]));
    }

    async newChat(e) {
        if (!e.msg) {
            return;
        }
        if (e.isGroup && !e.atme) {
            return;
        }
        id = e.user_id;
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            tempMsg = JSON.parse(`[
            {
              "content": "You are a helpful assistant",
              "role": "system"
            }
        ]`);
            json[id] = { 'messages': [tempMsg], 'status': 0, 'systemPrompt': 'You are a helpful assistant.', 'model': 'deepseek-chat', 'otherConfig': [4096, 0.7, 1.0, 0.0, 0.0], nowChat: 0 };
        } else {
            tempMsg = JSON.parse(`[
            {
              "content": "${json[id].systemPrompt}",
              "role": "system"
            }
            ]`);
            json[id].messages.push(tempMsg);
            json[id].nowChat = json[id].messages.length - 1;
        }
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply('已创建对话编号：' + (json[id].nowChat+1));
    }

    async changeChat(e) {
        if (!e.msg) {
            return;
        }
        if (e.isGroup && !e.atme) {
            return;
        }
        id = e.user_id;
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        let msg = e.msg.trim().replace(/#(bot|chat)(切换|更改)(对话)?\s*/g, '');
        let nowChat;
        if (msg=='') {
            e.reply('未指定切换目标');
            return;
        } else {
            nowChat = parseInt(msg, 10) - 1;
        }
        
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            e.reply('尚无任何对话记录，请使用#chat+你的问题进行第一次对话');
            return;
        } else if (isNaN(nowChat) || nowChat >= json[id].messages.length) {
            e.reply('非法对话编号或不存在的对话编号：'+e.msg.trim().replace(/#(bot|chat)(对话)?历史(对话)?\s*/g, ''));
            return;
        } else {
            json[id].nowChat = nowChat;
        }
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply('已经切换到对话编号：'+(nowChat+1));
        this.listChat(e);
    }

    async deleteChat(e) {
        if (!e.msg) {
            return;
        }
        if (e.isGroup && !e.atme) {
            return;
        }
        id = e.user_id;
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        let msg = e.msg.trim().replace(/#(bot|chat)删除(对话)?\s*/g, '');
        let nowChat;
        if (msg=='') {
            nowChat = json[id].nowChat;
        } else {
            nowChat = parseInt(msg, 10) - 1;
        }
        
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            e.reply('尚无任何对话记录，请使用#chat+你的问题进行第一次对话');
            return;
        } else if (isNaN(nowChat) || nowChat >= json[id].messages.length) {
            e.reply('非法对话编号或不存在的对话编号：'+e.msg.trim().replace(/#(bot|chat)(对话)?历史(对话)?\s*/g, ''));
            return;
        } else if (json[id].messages.length <= 1) {
            e.reply('请至少保留一个对话');
            return;
        } else {
            json[id].messages.splice(nowChat, 1);
            json[id].nowChat = 0;
        }
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply('已经删除对话编号：'+(nowChat+1)+'\n自动将当前对话切换为对话编号1');
    }

    async listChat(e) {
        if (!e.msg) {
            return;
        }
        if (e.isGroup && !e.atme) {
            return;
        }
        id = e.user_id;
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            tempMsg = JSON.parse(`[
            {
              "content": "You are a helpful assistant",
              "role": "system"
            }
        ]`);
            json[id] = { 'messages': [tempMsg], 'status': 0, 'systemPrompt': 'You are a helpful assistant.', 'model': 'deepseek-chat', 'otherConfig': [4096, 0.7, 1.0, 0.0, 0.0], nowChat: 0 };
        }
        let list = [];
        for (var i=0;i<json[id].messages.length;i++) {
            if (json[id].messages[i].length>1) {
                list.push(`[${i===json[id].nowChat?'*':'  '}] ${i+1}. User: ${json[id].messages[i][1].content}\n`);
            } else {
                list.push(`[${i===json[id].nowChat?'*':'  '}] ${i+1}. 尚未开始对话\n`);
            }
        }
        let forwardMsg = await this.makeForwardMsg(`目前有对话${json[id].messages.length}组：`, list);
        await e.reply(forwardMsg);
    }
     
    async help(e) {
        e.reply(await this.makeForwardMsg('DeepSeek Plugin 使用指南', `1. #chat历史对话 - 拉取目前对话的历史记录\n2. #chat重置对话 - 清除当前对话的聊天记录，重新开启话题\n3. #chat新建/切换/删除对话 - 新建对话，切换到指定对话与删除指定对话，切换或删除对话时请携带指定对话的编号\n4. #chat对话列表 - 列出目前所有的对话目录，并用*标记当前所在对话，列表同时列出对话的第一个提问方便辨别\n5. #chat更改模型 - 修改使用的模型，支持deepseek-reasoner(即R1)和deepseek-chat(即V3)，默认为deepseek-chat\n6. #chat更改提示词 - 修改bot的“人设”，默认为“You are a helpful assistant.”\n7. #chat设置 - 查看目前的设置档，其中的键名分别代表：status - 正在进行的的对话数目；systemPrompt - 系统提示词，决定bot的人设；model - 对话使用的模型名；otherConfig - 进阶设置的参数\n8. #chat更改进阶设置 - 以max_tokens，temperature，top_p，frequency_penalty，presence_penalty的顺序携带新的值来设置这些参数，默认值为4096, 0.7, 1.0, 0.0, 0.0，不了解这些设置的意义请勿更改`));
    }

    async configOther(e) {
        if (!e.msg) {
            return;
        }
        if (e.isGroup && !e.atme) {
            return;
        }
        id = e.user_id;

        function processInput(input) {
            const regex = /^#(bot|chat)((修|更)改|切换)进阶设置\s*(\d+)( )*(\d+|\d+\.\d+)( )*(\d+|\d+\.\d+)( )*(-?\d+|-?\d+\.\d+)( )*(-?\d+|-?\d+\.\d+)/i;
            const match = input.match(regex);

            if (!match) {
                e.reply("参数格式不正确，请按照指定格式输入参数。");
                return;
            }

            const max_tokens = parseInt(match[4], 10);
            const temperature = parseFloat(match[6]);
            const top_p = parseFloat(match[8]);
            const frequency_penalty = parseFloat(match[10]);
            const presence_penalty = parseFloat(match[12]);

            let errors = [];

            if (isNaN(max_tokens) || max_tokens < 1 || max_tokens > 8192) {
                errors.push(`max_tokens参数需要在1~8192，但设置了${match[4]}`);
            }
            if (isNaN(temperature) || temperature < 0 || temperature > 2) {
                errors.push(`temperature参数需要在0~2，但设置了${match[6]}`);
            }
            if (isNaN(top_p) || top_p < 0 || top_p > 1) {
                errors.push(`top_p参数需要在0~1，但设置了${match[8]}`);
            }
            if (isNaN(frequency_penalty) || frequency_penalty < -2 || frequency_penalty > 2) {
                errors.push(`frequency_penalty参数需要在-2~2，但设置了${match[10]}`);
            }
            if (isNaN(presence_penalty) || presence_penalty < -2 || presence_penalty > 2) {
                errors.push(`presence_penalty参数需要在-2~2，但设置了${match[12]}`);
            }

            if (errors.length > 0) {
                e.reply(errors.join('; '));
                return false;
            }

            return [
                max_tokens,
                temperature,
                top_p,
                frequency_penalty,
                presence_penalty
            ];
        }

        // 示例调用
        const result = processInput(e.msg);
        if (result === false) return;

        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            tempMsg = JSON.parse(`[
            {
              "content": "You are a helpful assistant",
              "role": "system"
            }
        ]`);
            json[id] = { 'messages': [tempMsg], 'status': 0, 'systemPrompt': 'You are a helpful assistant.', 'model': 'deepseek-chat', 'otherConfig': result, nowChat: 0 };
        } else {
            json[id].otherConfig = result;
        }
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件

        e.reply('修改对话模型啦');

    }

    async configModel(e) {
        if (!e.msg) {
            return;
        }
        if (e.isGroup && !e.atme) {
            return;
        }
        id = e.user_id;
        let msg = e.msg.trim().replace(/#(bot|chat)((修|更)改|切换)(对话)?模型\s*/g, '');
        if (msg !== "deepseek-chat" && msg !== "deepseek-reasoner") {
            e.reply(`${msg}可能是错误的模型名，DeepSeek官方api仅支持选择deepseek-chat或者deepseek-reasoner；若使用了其他api请忽略该提示`);
            //return;
        }
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            tempMsg = JSON.parse(`[
            {
              "content": "You are a helpful assistant",
              "role": "system"
            }
        ]`);
            json[id] = { 'messages': [tempMsg], 'status': 0, 'systemPrompt': 'You are a helpful assistant.', 'model': msg, 'otherConfig': [4096, 0.7, 1.0, 0.0, 0.0], nowChat: 0 };
        } else {
            json[id].model = msg;
        }
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件

        e.reply('修改对话模型啦');

    }

    async configPrompt(e) {
        if (!e.msg) {
            return;
        }
        if (e.isGroup && !e.atme) {
            return;
        }
        id = e.user_id;
        let msg = e.msg.trim().replace(/#(bot|chat)((修|更)改|切换)(系统)?提示词?\s*/g, '');
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            tempMsg = JSON.parse(`[
            {
              "content": "${msg}",
              "role": "system"
            }
        ]`);
            json[id] = { 'messages': [tempMsg], 'status': 0, 'systemPrompt': msg, 'model': 'deepseek-chat', 'otherConfig': [4096, 0.7, 1.0, 0.0, 0.0], nowChat: 0 };
        } else {
            json[id].systemPrompt = msg;
            // 遍历 json[id].messages
            for (let i = 0; i < json[id].messages[json[id].nowChat].length; i++) {
                if (json[id].messages[json[id].nowChat][i].role === "system") {
                    // 找到 role 为 "system" 的消息
                    json[id].messages[json[id].nowChat][i].content = msg; // 将 msg 赋值给 json[id].messages[0].content
                    break; // 找到后退出循环
                }
            }
        }
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件

        e.reply('修改系统提示啦');

    }

    async reset(e) {
        if (!e.msg) {
            return;
        }
        if (e.isGroup && !e.atme) {
            return;
        }
        id = e.user_id;
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            tempMsg = JSON.parse(`[
            {
              "content": "You are a helpful assistant",
              "role": "system"
            }
        ]`);
            json[id] = { 'messages': [tempMsg], 'status': 0, 'systemPrompt': 'You are a helpful assistant.', 'model': 'deepseek-chat', 'otherConfig': [4096, 0.7, 1.0, 0.0, 0.0], nowChat: 0 };
        } else {
            tempMsg = JSON.parse(`[
            {
              "content": "${json[id].systemPrompt}",
              "role": "system"
            }
            ]`);
            json[id].messages[json[id].nowChat] = tempMsg;
        }
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件

        e.reply('重置聊天对话啦');

    }

    async history(e) {
        if (!e.msg) {
            return;
        }
        if (e.isGroup && !e.atme) {
            return;
        }
        id = e.user_id;
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        let msg = e.msg.trim().replace(/#(bot|chat)(对话)?历史(对话)?\s*/g, '');
        let nowChat;
        if (msg=='') {
            nowChat = json[id].nowChat;
        } else {
            nowChat = parseInt(msg, 10) - 1;
        }
        if (isNaN(nowChat) || nowChat >= json[id].messages.length) {
            e.reply('非法对话编号或不存在的对话编号：'+e.msg.trim().replace(/#(bot|chat)(对话)?历史(对话)?\s*/g, '')+'\n将返回当前对话历史');
            nowChat = json[id].nowChat;
        }
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            tempMsg = JSON.parse(`[
            {
              "content": "You are a helpful assistant",
              "role": "system"
            }
        ]`);
            json[id] = { 'messages': [tempMsg], 'status': 0, 'systemPrompt': 'You are a helpful assistant.', 'model': 'deepseek-chat', 'otherConfig': [4096, 0.7, 1.0, 0.0, 0.0], nowChat: 0 };
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        } else {
            tempMsg = json[id].messages[nowChat];
        }
        let forwardMsg = await this.makeForwardMsg(`会话编号：${nowChat+1}\n目前有历史记录${tempMsg.length}条：`, JSON.stringify(tempMsg));
        await e.reply(forwardMsg);
    }

    async chat(e) {
        if (!e.msg) {
            return;
        }
        if (e.isGroup && !e.atme) {
            return;
        }
        id = e.user_id;
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (json.hasOwnProperty(id) && json[id].status >= chatLimit) {
            e.reply(`不得有超过${chatLimit}个对话正在请求，请稍后`);
            return;
        }

        e.reply('思考中……');
        json[id].status++;
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件

        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            tempMsg = JSON.parse(`[
            {
              "content": "You are a helpful assistant",
              "role": "system"
            }
        ]`);
            json[id] = { 'messages': [tempMsg], 'status': 0, 'systemPrompt': 'You are a helpful assistant.', 'model': 'deepseek-chat', 'otherConfig': [4096, 0.7, 1.0, 0.0, 0.0], nowChat: 0 };
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        } else {
            tempMsg = JSON.parse(JSON.stringify(json[id].messages[json[id].nowChat]));
            // 遍历 tempMsg 并删除每个对象的 reasoning_content 键
            tempMsg.forEach(item => {
                if (item.hasOwnProperty("reasoning_content")) {
                    item.content = item.reasoning_content + item.content; // reasoning_content添加到头
                    delete item.reasoning_content; // 删除 reasoning_content 键
                }
            });
        }

        let res, res2, result, usage;
        let msg = e.msg.trim().replace(/#(bot|chat)\s*/g, '');
        for (var i = tempMsg.length-1; i >= 0; i--) {
            if(tempMsg[i].role=="user") {
                if (tempMsg[i].content==msg) {
                    for (var j = tempMsg.length-1; j >= i; j--) {
                        tempMsg.pop();
                        json[id].messages[json[id].nowChat].pop();
                    }
                    e.reply('检测到相同问题，将再次提问');
                }
                break;
            }
        }
        if (tempMsg[tempMsg.length - 1].role == "user") {
            tempMsg.pop();
        }
        if (tempMsg.length > 21) {
            for (; tempMsg.length <= 21;) {
                tempMsg.remove(tempMsg[1]);
            }
        }
        tempMsg.push({ "content": msg, "role": "user" });
        var data = {
            "model": json[id].model,
            "messages": tempMsg,
            "max_tokens": json[id].otherConfig[0],
            "temperature": json[id].otherConfig[1],
            "top_p": json[id].otherConfig[2],
            "frequency_penalty": json[id].otherConfig[3],
            "presence_penalty": json[id].otherConfig[4],
        };

        try {
            res = await fetch(base_url, {
                method: "post",
                maxBodyLength: Infinity,
                body: JSON.stringify(data),

                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + apikey
                }

            });
            res2 = await res.json();
            result = res2.choices[0].message;
            usage = res2.usage;
        } catch (err) {
            console.log(err);
            console.log('没有访问成功');
            e.reply('没有访问成功，请重试\n' + err + '\n' + JSON.stringify(res.text()) + '\n' + JSON.stringify(data));
            json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8")); //读取文件
            // 遍历 initJson 中的所有项目
            json[id].status = Math.max(json[id].status - 1, 0);
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            return false;
        }
        let jieguo = (result.reasoning_content ? ('<think>' + result.reasoning_content + '</think>\n-------\n') : '') + result.content + '\n-------\n对话编号：'+(json[id].nowChat+1)+'\n模型名：' + res2.model + '\n总计用量：' + usage.total_tokens + '\n提示词token(总/命中/未命中)：' + usage.prompt_tokens + '/' + usage.prompt_cache_hit_tokens + '/' + usage.prompt_cache_miss_tokens + '\n回答token(总/思考/回答)：' + usage.completion_tokens + '/' + ((usage && usage.completion_tokens_details && usage.completion_tokens_details.reasoning_tokens) || 0) + '/' + (usage.completion_tokens - ((usage && usage.completion_tokens_details && usage.completion_tokens_details.reasoning_tokens) || 0)) + '\n费用：' + ((res2.model == "deepseek-chat"||res2.model == "deepseek-v3") ? ((((usage.prompt_cache_hit_tokens !== undefined||usage.prompt_cache_hit_tokens !== undefined) ? (usage.prompt_cache_hit_tokens * 0.5 / 1000000 + usage.prompt_cache_miss_tokens * 2 / 1000000) : usage.prompt_tokens * 2 /1000000) + usage.completion_tokens * 8 /1000000).toFixed(6) + '元/' + ((((usage.prompt_cache_hit_tokens !== undefined||usage.prompt_cache_hit_tokens !== undefined) ? (usage.prompt_cache_hit_tokens * 0.5 / 1000000 + usage.prompt_cache_miss_tokens * 2 / 1000000) : usage.prompt_tokens * 2 /1000000) + usage.completion_tokens * 8 /1000000)/7).toFixed(6) + '美元') : ((((usage.prompt_cache_hit_tokens !== undefined||usage.prompt_cache_hit_tokens !== undefined) ? (usage.prompt_cache_hit_tokens * 1 / 1000000 + usage.prompt_cache_miss_tokens * 4 / 1000000) : usage.prompt_tokens * 4 /1000000) + usage.completion_tokens * 16 /1000000).toFixed(6) + '元/' + ((((usage.prompt_cache_hit_tokens !== undefined||usage.prompt_cache_hit_tokens !== undefined) ? (usage.prompt_cache_hit_tokens * 1 / 1000000 + usage.prompt_cache_miss_tokens * 4 / 1000000) : usage.prompt_tokens * 4 /1000000) + usage.completion_tokens * 16 /1000000)/7).toFixed(6) + '美元'));
        //delete result.tool_calls
        json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8")); //读取文件
        json[id].messages[json[id].nowChat].push({ "content": msg, "role": "user" });
        json[id].messages[json[id].nowChat].push(result);
        json[id].status = Math.max(json[id].status - 1, 0);
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        // logger.mark(`[AI回复]${tempMsg}`)
        e.reply(jieguo, true);
        //console.log(res2.choices[0])
        return false;

    }

    async makeForwardMsg(title, msg) {
        let nickname = Bot.nickname;
        if (this.e.isGroup) {
            let info = await Bot.pickMember(this.e.group_id, Bot.uin);
            nickname = info.card ? info.card : info.nickname;
        }
        let userInfo = {
            user_id: Bot.uin,
            nickname
        };

        let forwardMsg = [
            {
                ...userInfo,
                message: title
            },
            {
                ...userInfo,
                message: msg
            }
        ];

        /** 制作转发内容 */
        if (this.e.isGroup) {
            forwardMsg = await this.e.group.makeForwardMsg(forwardMsg);
        } else {
            forwardMsg = await this.e.friend.makeForwardMsg(forwardMsg);
        }

        /** 处理描述 */
        forwardMsg.data = JSON.stringify(forwardMsg.data);
        forwardMsg.data = forwardMsg.data
            .replace(/\n/g, '')
            .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
            .replace(/___+/, `<title color="#777777" size="26">${title}</title>`);
        forwardMsg.data = JSON.parse(forwardMsg.data);

        return forwardMsg;
    }

}


async function getAgent() {
    let proxyAddress = cfg.bot.proxyAddress;
    if (!proxyAddress) return null;
    if (proxyAddress === 'http://0.0.0.0:0') return null;



    if (HttpsProxyAgent === '') {
        HttpsProxyAgent = await import('https-proxy-agent').catch((err) => {
            logger.error(err);
        });

        HttpsProxyAgent = HttpsProxyAgent ? HttpsProxyAgent.default : undefined;
    }

    if (HttpsProxyAgent) {
        return new HttpsProxyAgent(proxyAddress);
    }

    return null;
}
async function imgUrlToBase64(url) {
    let base64Img;
    return new Promise(function (resolve, reject) {
        let req = http.get(url, function (res) {
            var chunks = [];
            var size = 0;
            res.on('data', function (chunk) {
                chunks.push(chunk);
                size += chunk.length;
                //累加缓冲数据的长度
            });
            res.on('end', function (err) {
                var data = Buffer.concat(chunks, size);
                base64Img = data.toString('base64');
                resolve({
                    success: true,
                    base64Img
                });
            });
        });
        req.on('error', (e) => {
            resolve({
                success: false,
                errmsg: e.message
            });
        });
        req.end();
    });
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
