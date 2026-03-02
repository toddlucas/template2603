using System.Globalization;

namespace Base2.Pagination;

public static class PagedQueryExtensions
{
    public const int NoQueryLimit = 0;
    public const int DefaultQueryLimit = 100;
    public const int DefaultQueryMax = 1000;
    private const int DefaultSearchTermLimit = 3;

    public static IQueryable<T> Paginate<T>(this IOrderedQueryable<T> queryable, PagedQuery query, out int count, int max = DefaultQueryMax, Dictionary<string, string>? viewToDataColumnMap = null)
    {
        // Query the count prior to applying page/limit.
        // http://stackoverflow.com/a/4284469/51558
        count = queryable.Count();

        if (query == null)
        {
            return queryable;
        }

        // Page is 1-based.
        if (query.Page < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(query), "Page must be 1 or greater.");
        }

        int limit = query.Limit ?? DefaultQueryLimit;
        int take = limit;
        if (max != NoQueryLimit)
        {
            take = Math.Min(limit, max);
        }

        //  limit   max     actual
        //  null    1000    100 (default)
        //  50      1000    50
        //  150     1000    150
        //  2000    1000    1000
        //  2000    0       2000 (no max)
        var modifiedQuery = queryable.Skip((query.Page - 1) * limit);
        modifiedQuery = modifiedQuery.Take(take);

        return modifiedQuery;
    }

    public static void Search(this PagedQuery query, Action<string> addTerm, int limit = DefaultSearchTermLimit)
    {
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            string[] terms = query.Search
                .ToLower(CultureInfo.CurrentCulture)
                .Split(' ')
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrEmpty(s))
                .ToArray();

            foreach (string term in terms)
            {
                if (--limit < 0)
                    break;

                addTerm(term);
            }
        }
    }
}
