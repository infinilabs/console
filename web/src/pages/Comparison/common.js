export const generateName = (record)=>{
  return `比对 ${record.cluster.source.name} 和 ${record.cluster.target.name} 中的 ${record.indicesCount} 个索引`
}
