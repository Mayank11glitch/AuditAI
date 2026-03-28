 
 
import { SignInCard2 } from "@/components/ui/sign-in-card-2";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <SignInCard2 
      onContinueAsGuest={() => navigate("/dashboard")}
      onSuccess={() => navigate("/dashboard")}
    />
  );
}
