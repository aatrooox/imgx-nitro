import { useSafeValidatedQuery, z } from "h3-zod";
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js'
const templateString = `<div class="w-full h-full flex justify-center items-center">
  <div 
    class="w-full h-full flex flex-col p-8 rounded-3xl"
    :style="{
      background: bgGradient
    }"
  >
    <div class="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
      <div class="flex items-center justify-center text-gray-500">
        {{ iconText }}
      </div>
    </div>
    
    <div class="flex text-gray-500 mb-6">
      {{ date }}
    </div>
    
    <div class="flex mb-4">
      <div class="flex items-center">
        <div class="mr-2">{{ handEmoji }}</div>
        <div class="text-2xl font-bold">{{ greeting }}</div>
      </div>
    </div>
    
    <div class="flex mb-4">
      <div class="flex items-center">
        <div class="mr-2">{{ lightEmoji }}</div>
        <div>{{ description }}</div>
      </div>
    </div>
    
    <div class="flex flex-col space-y-2 mb-auto">
      <div class="flex items-start" v-for="(item, index) in listItems" :key="index">
        <div class="flex mr-2">-</div>
        <div class="flex">{{ item }}</div>
      </div>
    </div>
    
    <div class="flex justify-between mt-4">
      <div class="flex text-gray-500">{{ signature }}</div>
      <div class="flex text-gray-500">{{ wordCount }}</div>
    </div>
  </div>
</div>`
const props = {
  "bgGradient": "linear-gradient(to bottom, #7edfd3, #7eb0e3)",
  "iconText": "🚲",
  "date": "2025年3月12日",
  "handEmoji": "👋",
  "greeting": "hi 你好",
  "lightEmoji": "💡",
  "description": "你可以在这里输入文字尝试一下，支持 Markdown 语法实时渲染。",
  "listItems": [
    "复制粘贴可插入图片",
    "Ctrl+I 斜体文本",
    "Ctrl+B 加粗文本",
    "二维码可修改隐藏"
  ],
  "signature": "是魔王哒",
  "wordCount": "字数：86"
}

export default defineEventHandler(async (event) => {
  const YouSheBiaoTi = await useStorage('db').getItemRaw(`SourceHanSerifCN-Regular-1.otf`)
  const vNode = await vueTemplateToSatori(templateString, props)
  // console.log(`vNode`, JSON.stringify(vNode, null, 2) )
  const svg = await satori(
    vNode
    ,
    {
      width: 400,
      height: 600,
      fonts: [
        {
          name: 'YouSheBiaoTi',
          data: YouSheBiaoTi,
          weight: 400,
          style: 'normal',
        }
      ],
    }
  )
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'original',
    },
  })

  const png = resvg.render()

  setHeader(event, 'Content-Type', 'image/png')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')
  // 生成强验证器
  const etag = `"${Buffer.from(JSON.stringify(getQuery(event))).toString('base64')}"` 
  setHeader(event, 'ETag', etag);
  setHeader(event, 'Last-Modified', new Date().toUTCString());

  // 检查客户端缓存
  const ifNoneMatch = getRequestHeader(event, 'if-none-match')
  if (ifNoneMatch === etag) {
    event.node.res.statusCode = 304
    return null
  }

  return png.asPng()
});
