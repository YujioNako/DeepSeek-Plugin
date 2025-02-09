# DeepSeek-Plugin
A Yunzai-Bot plugin provide deepseek AI service

## 使用方法与命令指南
1. #bot历史对话 - 拉取目前对话的历史记录

2. #bot重置对话 - 清除当前对话的聊天记录，重新开启话题

3. #bot新建/切换/删除对话 - 新建对话，切换到指定对话与删除指定对话，切换或删除对话时请携带指定对话的编号

4. #bot对话列表 - 列出目前所有的对话目录，并用*标记当前所在对话，列表同时列出对话的第一个提问方便辨别

5. #bot更改模型 - 修改使用的模型，支持deepseek-reasoner(即R1)和deepseek-chat(即V3)，默认为deepseek-chat

6. #bot更改提示词 - 修改bot的“人设”，默认为“You are a helpful assistant.”

7. #bot设置 - 查看目前的设置档，其中的键名分别代表：status - 是否有正在进行的对话；systemPrompt - 系统提示词，决定bot的人设；model - 对话使用的模型名；otherConfig - 进阶设置的参数

8. #bot更改进阶设置 - 以max_tokens，temperature，top_p，frequency_penalty，presence_penalty的顺序携带新的值来设置这些参数，默认值为4096, 0.7, 1.0, 0.0, 0.0，不了解这些设置的意义请勿更改

#### 你也可以发送#bot帮助来获取上述内容

## 进阶
你可以通过更改api url与默认模型/允许的模型来使用其他AI api（毕竟基本上所有主流AI都支持OpenAI的接口协议）

## 鸣谢
感谢[Miao-Yunzai](https://github.com/yoimiya-kokomi/Miao-Yunzai)与[原版Yunzai](https://gitee.com/le-niao/Yunzai-Bot)

感谢[DeepSeek](https://www.deepseek.com/)开源（不是）
