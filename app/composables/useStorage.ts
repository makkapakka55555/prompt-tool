import { ref,watch } from 'vue'
//提示词库
export interface StorageDate{
    id:string,
    title:string,
    content:string,
    category:string,
    createdAt:number
}
//自定义模板
export interface CustomTemplate{
    id:string,
    name:string,
    systemPrompt:string,
    category:string,
    label:string,
    createdAt:number,
}

//localStorage
export function getStorageData<T>(key:string,defaultValue:T){
    const data = ref<T>(defaultValue)
    try{
        const raw = localStorage.getItem(key)
        if(raw){
            data.value = JSON.parse(raw)
        }
    }catch(error){
        console.error('获取存储数据失败',error)
    }
     //变化时保存
    watch(data,(val)=>{
        localStorage.setItem(key,JSON.stringify(val))
    }, { deep: true })
    return data
}
