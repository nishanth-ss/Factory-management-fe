import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
  } from "@/components/ui/pagination";
  

interface PaginatedNavigationProps {
    page: number;
    totalPages: number;
    setPage: (page: number) => void;
  }

export function PaginatedNavigation({ page, totalPages, setPage }: PaginatedNavigationProps) {
    return (
      <Pagination className="mt-6 justify-center">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page > 1) setPage(page - 1);
              }}
              className={page <= 1 ? "opacity-50 pointer-events-none" : ""}
            />
          </PaginationItem>
  
          <PaginationItem>
            <span className="text-sm px-3 py-2 rounded-md border">
              Page {page} of {totalPages}
            </span>
          </PaginationItem>
  
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page < totalPages) setPage(page + 1);
              }}
              className={page >= totalPages ? "opacity-50 pointer-events-none" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }
  