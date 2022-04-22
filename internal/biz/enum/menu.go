package enum

type Menu struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	Privilege string `json:"privilege,omitempty"`
}
