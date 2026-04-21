export const generateName = (record)=>{
  return `从 ${record.cluster.source.name} 迁移 ${record.indicesCount} 个索引到 ${record.cluster.target.name}`
}
