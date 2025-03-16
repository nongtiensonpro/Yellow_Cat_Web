export default function Home() {
  return (
    <>
        <section className="mb-12">
          <h1 className="text-4xl font-bold text-center mb-6 text-gray-800 dark:text-white">
            Chào mừng đến với YellowCat
          </h1>
          <p className="text-lg text-center text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Đây là trang chủ của dự án YellowCat, được xây dựng với Next.js và Tailwind CSS.
          </p>
        </section>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div 
              key={item} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                Tính năng {item}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Mô tả chi tiết về tính năng này của dự án YellowCat.
              </p>
            </div>
          ))}
        </div>
    </>
  );
}
