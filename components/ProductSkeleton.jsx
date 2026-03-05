import React from "react"
import ContentLoader, { Rect, Circle, Path } from "react-content-loader/native"
const ProductSkeleton = (props) => (
    <ContentLoader 
          speed={1}
          width={400}
          height={160}
          viewBox="0 0 400 160"
          backgroundColor="red"
          foregroundColor="blue"
          {...props}
        >
          <Rect x="68" y="8" rx="3" ry="3" width="280" height="15" /> 
          <Rect x="68" y="26" rx="3" ry="3" width="50" height="15" /> 
          <Rect x="10" y="5" rx="6" ry="6" width="49" height="40" />

    </ContentLoader>
)

export default ProductSkeleton