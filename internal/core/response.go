package core

type Response struct {
	Total  int64       `json:"total,omitempty"`
	Hit    interface{} `json:"hit,omitempty"`
	Id     string      `json:"_id,omitempty"`
	Result string      `json:"result,omitempty"`
}
type FoundResp struct {
	Found  bool        `json:"found"`
	Id     string      `json:"_id,omitempty"`
	Source interface{} `json:"_source,omitempty"`
}

func CreateResponse(id string) Response {
	return Response{
		Id:     id,
		Result: "created",
	}
}
func UpdateResponse(id string) Response {
	return Response{
		Id:     id,
		Result: "updated",
	}
}
func DeleteResponse(id string) Response {
	return Response{
		Id:     id,
		Result: "deleted",
	}
}
func NotFoundResponse(id string) FoundResp {
	return FoundResp{
		Id:    id,
		Found: false,
	}
}
func FoundResponse(id string, data interface{}) FoundResp {
	return FoundResp{
		Id:     id,
		Found:  true,
		Source: data,
	}
}
