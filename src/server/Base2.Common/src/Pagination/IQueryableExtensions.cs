using System.Globalization;
using System.Linq.Dynamic.Core;

namespace Base2.Pagination;

public static class IQueryableExtensions
{
    public static IOrderedQueryable<T> OrderByPage<T>(this IQueryable<T> queryable, PagedQuery query, string defaultOrderBy)
    {
        string orderByColumnName = defaultOrderBy;
        if (query.Column != null && query.Column.Length > 0)
        {
            orderByColumnName = query.Column[0];

            if (query.Direction?.Length > 0)
            {
                // Convert to the ordering terms required by System.Linq.Dynamic.
                string direction = string.Empty;
                string dir = query.Direction[0].ToUpper(CultureInfo.InvariantCulture);
                if (!string.IsNullOrWhiteSpace(direction))
                {
                    if (dir == "DESC")
                    {
                        direction = "descending";
                    }
                    else if (dir == "ASC")
                    {
                        direction = "ascending";
                    }
                    else
                    {
                        throw new Exception($"Invalid query direction {query.Direction[0]}");
                    }

                    orderByColumnName += " " + direction;
                }
            }
        }

        return queryable.OrderBy(orderByColumnName);
    }
}
