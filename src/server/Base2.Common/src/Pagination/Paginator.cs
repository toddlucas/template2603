namespace Base2.Pagination;

public class Paginator
{
    public static async Task<int> CursorPaginateAsync<T, TId>(
        Func<TId?, Task<IList<T>>> readPageAsync,
        Func<T, TId> idSelector,
        Func<IList<T>, Task<bool>> handlePageAsync)
    {
        TId? cursor = default;
        int count = 0;
        bool kontinue = true;
        while (kontinue)
        {
            IList<T> records = await readPageAsync(cursor);
            if (!records.Any())
                break;

            // Paginate efficiently rather than with Skip and table scans.
            cursor = idSelector(records.Last());

            count += records.Count;

            kontinue = await handlePageAsync(records);
        }

        return count;
    }
}
