namespace WebsiteServiceEcommerce.API.Helpers
{
    public static class OrderWorkflow
    {
        public const string Pending = "Pending";
        public const string Confirmed = "Confirmed";
        public const string Preparing = "Preparing";
        public const string Processing = "Processing";
        public const string Shipping = "Shipping";
        public const string Delivered = "Delivered";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";
        public const string DeliveryFailed = "DeliveryFailed";

        public static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            Pending,
            Confirmed,
            Preparing,
            Shipping,
            Delivered,
            Completed,
            Cancelled,
            DeliveryFailed
        };

        public static string Normalize(string? status)
        {
            return status switch
            {
                "InProgress" => Preparing,
                "UnderReview" => Preparing,
                Processing => Preparing,
                "Delivering" => Shipping,
                null or "" => Pending,
                _ => status
            };
        }

        public static bool CanCustomerCancel(string? currentStatus)
        {
            var current = Normalize(currentStatus);
            return current is Pending or Confirmed;
        }

        public static bool CanCustomerComplete(string? currentStatus)
        {
            var current = Normalize(currentStatus);
            return current is Delivered;
        }

        public static bool CanProviderTransition(string? currentStatus, string? nextStatus)
        {
            var current = Normalize(currentStatus);
            var next = Normalize(nextStatus);

            if (!ValidStatuses.Contains(next) || current is Completed or Cancelled)
            {
                return false;
            }

            if (current == next)
            {
                return true;
            }

            return current switch
            {
                Pending => next == Confirmed,
                Confirmed => next == Preparing,
                Preparing => next == Shipping,
                Shipping => next is Delivered or DeliveryFailed,
                DeliveryFailed => next == Shipping,
                _ => false
            };
        }

        public static bool CanAdminSet(string? currentStatus, string? nextStatus)
        {
            var current = Normalize(currentStatus);
            var next = Normalize(nextStatus);

            if (!ValidStatuses.Contains(next))
            {
                return false;
            }

            if (current is Completed or Cancelled)
            {
                return current == next;
            }

            if (current == next)
            {
                return true;
            }

            return true;
        }

        public static bool CanSubmitDeliveryUpdate(string? currentStatus)
        {
            var current = Normalize(currentStatus);
            return current is Pending or Confirmed or Preparing or Shipping or DeliveryFailed;
        }
    }
}
