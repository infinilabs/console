package dto

type Login struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
type UpdatePassword struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}
