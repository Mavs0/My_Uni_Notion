import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não fornecido" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${user.id}/${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const bucketName = folder === "feed" ? "biblioteca" : folder;

    console.log("📤 Iniciando upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      filePath,
      bucketName,
    });

    let uploadData, uploadError;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const { data: uploadDataResult, error: uploadErrorResult } =
        await adminClient.storage.from(bucketName).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      uploadData = uploadDataResult;
      uploadError = uploadErrorResult;
    } else {
      const { data: uploadDataResult, error: uploadErrorResult } =
        await supabase.storage.from(bucketName).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      uploadData = uploadDataResult;
      uploadError = uploadErrorResult;
    }

    if (uploadError) {
      console.error("❌ Erro ao fazer upload:", uploadError);

      if (
        uploadError.message?.includes("Bucket not found") ||
        uploadError.message?.includes("does not exist") ||
        (uploadError as any).statusCode === 404
      ) {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            console.log(
              "🔧 Tentando criar bucket 'biblioteca' automaticamente..."
            );
            const adminClient = createSupabaseAdmin();
            const { data: bucketData, error: bucketError } =
              await adminClient.storage.createBucket("biblioteca", {
                public: true,
                fileSizeLimit: 10485760,
                allowedMimeTypes: [
                  "application/pdf",
                  "text/csv",
                  "image/jpeg",
                  "image/png",
                  "image/jpg",
                ],
              });

            if (bucketError) {
              console.error("❌ Erro ao criar bucket:", bucketError);
              return NextResponse.json(
                {
                  error: "Bucket 'biblioteca' não encontrado",
                  details:
                    "Não foi possível criar o bucket automaticamente. Por favor, crie o bucket 'biblioteca' no Supabase Storage manualmente. Veja CRIAR_BUCKET_BIBLIOTECA.md",
                  bucketError: bucketError.message,
                },
                { status: 500 }
              );
            }

            console.log("✅ Bucket 'biblioteca' criado com sucesso!");

            const { data: retryUpload, error: retryError } =
              await adminClient.storage
                .from(bucketName)
                .upload(filePath, file, {
                  cacheControl: "3600",
                  upsert: false,
                });

            if (retryError) {
              console.error(
                "❌ Erro ao fazer upload após criar bucket:",
                retryError
              );
              return NextResponse.json(
                {
                  error: "Erro ao fazer upload após criar bucket",
                  details: retryError.message || JSON.stringify(retryError),
                },
                { status: 500 }
              );
            }

            uploadData = retryUpload;
          } catch (createError: any) {
            console.error("❌ Erro ao tentar criar bucket:", createError);
            return NextResponse.json(
              {
                error: "Bucket 'biblioteca' não encontrado",
                details:
                  "Por favor, crie o bucket 'biblioteca' no Supabase Storage. Veja CRIAR_BUCKET_BIBLIOTECA.md para instruções.",
                createError: createError.message,
              },
              { status: 500 }
            );
          }
        } else {
          return NextResponse.json(
            {
              error: "Bucket 'biblioteca' não encontrado",
              details:
                "Por favor, crie o bucket 'biblioteca' no Supabase Storage. Veja CRIAR_BUCKET_BIBLIOTECA.md para instruções.",
              uploadError: uploadError.message,
            },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error: "Erro ao fazer upload do arquivo",
            details: uploadError.message || JSON.stringify(uploadError),
          },
          { status: 500 }
        );
      }
    }

    if (!uploadData) {
      return NextResponse.json(
        { error: "Upload concluído mas nenhum dado retornado" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    console.log("✅ Upload concluído:", { path: filePath, url: publicUrl });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error("Erro na API de upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
