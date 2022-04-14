package rbac

type CreateUserReq struct {
	Username string `json:"username" `
	Password string `json:"password" `
	Name     string `json:"name" `
	Phone    string `json:"phone" `
	Email    string `json:"email" `
}
