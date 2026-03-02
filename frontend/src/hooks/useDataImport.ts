import { useQuery, useMutation } from "@tanstack/react-query"
import { dataImportApi } from "@/lib/api/data-import"

export function useImportEntities() {
  return useQuery({
    queryKey: ["import-entities"],
    queryFn: () => dataImportApi.getEntities(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function usePreviewImport() {
  return useMutation({
    mutationFn: ({
      file,
      entityType,
    }: {
      file: File
      entityType: string
    }) => dataImportApi.preview(file, entityType),
  })
}

export function useImportData() {
  return useMutation({
    mutationFn: ({
      file,
      entityType,
      mapping,
    }: {
      file: File
      entityType: string
      mapping: Record<string, string>
    }) => dataImportApi.importData(file, entityType, mapping),
  })
}

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: (entityType: string) => dataImportApi.getTemplate(entityType),
    onSuccess: (blob, entityType) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${entityType}-template.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  })
}
