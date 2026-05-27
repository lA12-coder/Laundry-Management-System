import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import AccountClaimForm from "../../components/customer/AccountClaimForm";
import {
  normalizePhoneInput,
  startGhostSession,
} from "../../services/ghostAccountApi";
import { loginSuccess } from "../../redux/userSlice";

export default function ClaimAccountPage() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [sessionReady, setSessionReady] = useState(false);

  const ghostMutation = useMutation({
    mutationFn: startGhostSession,
    onSuccess: (payload) => {
      dispatch(
        loginSuccess({
          user: payload.user,
          token: payload.access,
          refreshToken: payload.refresh,
        }),
      );
      setPhone(payload.user?.phone_number || phone);
      setSessionReady(true);
    },
    onError: () => {
      toast.error("Could not start guest session. Check your phone number in the link.");
      setSessionReady(true);
    },
  });

  useEffect(() => {
    const raw = searchParams.get("phone");
    if (!raw) {
      setSessionReady(true);
      return;
    }
    try {
      const normalized = normalizePhoneInput(raw);
      setPhone(normalized);
      ghostMutation.mutate(normalized);
    } catch {
      setPhone(raw);
      setSessionReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!sessionReady && ghostMutation.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center pt-28">
        <Loader2 className="animate-spin text-[#4c84a4]" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-28">
      <AccountClaimForm defaultPhone={phone} />
    </div>
  );
}
